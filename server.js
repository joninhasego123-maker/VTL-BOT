const express = require("express");
const crypto = require("crypto");
const supabase = require("./supabase");

const app = express();
app.disable("x-powered-by");

const GUILD_ID = process.env.GUILD_ID || null;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const SECRET = process.env.SESSION_SECRET || "";
const BOT_TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN || "";
const SITE_URL = (process.env.SITE_URL || "https://prompsleague.onrender.com").replace(/\/$/, "");
const API_URL = (
    process.env.API_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "https://vtl-bot-167.onrender.com"
).replace(/\/$/, "");
const REDIRECT_URI = API_URL + "/auth/callback";

// Roblox OAuth
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || "";
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || "";
const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || API_URL + "/auth/roblox/callback";

// Servidor / cargo / apelido
const SERVER_ID = process.env.SERVER_ID || "1552629584967503872";
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID || "1554415711148052553";
// "roblox" = Display name (@username) do Roblox | "discord" = do Discord
const NICK_SOURCE = (process.env.NICK_SOURCE || "roblox").toLowerCase();

// Origem permitida no CORS (so o seu site). Use CORS_ORIGIN=* para liberar geral.
const CORS_ORIGIN = process.env.CORS_ORIGIN || SITE_URL;

// Avisos de configuracao no boot
if (!SECRET) console.warn("[config] SESSION_SECRET ausente: ninguem consegue logar.");
if (!CLIENT_ID || !CLIENT_SECRET) console.warn("[config] Discord OAuth incompleto.");
if (!ROBLOX_CLIENT_ID || !ROBLOX_CLIENT_SECRET) console.warn("[config] Roblox OAuth incompleto.");
if (!BOT_TOKEN) console.warn("[config] Token do bot ausente: cargo/apelido/avatares nao funcionam.");

process.on("unhandledRejection", e => console.error("unhandledRejection:", e));
process.on("uncaughtException", e => console.error("uncaughtException:", e));

// fetch com timeout (evita a API ficar pendurada se Discord/Roblox travar)
function fetchT(url, opts, ms) {
    return fetch(url, { ...(opts || {}), signal: AbortSignal.timeout(ms || 8000) });
}

// JSON seguro (se a resposta nao for JSON, devolve {})
async function jsonSeguro(r) {
    try {
        return await r.json();
    } catch (e) {
        return {};
    }
}

// Cabecalhos: CORS + seguranca
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (req.path.startsWith("/api/") || req.path.startsWith("/auth/")) {
        res.setHeader("Cache-Control", "no-store");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

// Tokens assinados (sem cookies)
function assinar(obj) {
    const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
    const s = crypto.createHmac("sha256", SECRET).update(p).digest("base64url");
    return p + "." + s;
}

function verificar(tok) {
    if (!tok || !SECRET) return null;
    const partes = String(tok).split(".");
    if (partes.length !== 2) return null;
    const esperado = crypto.createHmac("sha256", SECRET).update(partes[0]).digest("base64url");
    const a = Buffer.from(partes[1]);
    const b = Buffer.from(esperado);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const o = JSON.parse(Buffer.from(partes[0], "base64url").toString());
        // exige expiracao: token sem "exp" nao vale
        if (!o.exp || o.exp < Date.now()) return null;
        return o;
    } catch (e) {
        return null;
    }
}

function exigirLogin(req, res, next) {
    const h = req.headers.authorization || "";
    const user = verificar(h.replace(/^Bearer\s+/i, ""));
    if (!user || !user.id) return res.status(401).json({ error: "login" });
    req.user = user;
    next();
}

// Cache dos dados da liga (declarado aqui no topo, usado em varias funcoes)
let cache = { at: 0, data: null };
let carregando = null;

// ---------------------------------------------------------------
// Discord (usuario por ID, com cache)
// ---------------------------------------------------------------
const discordCache = {};

async function buscarDiscord(id, forcar) {
    const c = discordCache[id];
    if (!forcar && c && Date.now() - c.at < (c.data ? 6 * 3600e3 : 5 * 60e3)) return c.data;

    let data = null;

    if (BOT_TOKEN) {
        try {
            const r = await fetchT("https://discord.com/api/v10/users/" + id, {
                headers: { Authorization: "Bot " + BOT_TOKEN }
            });
            if (r.ok) {
                const u = await r.json();
                data = {
                    id: u.id,
                    username: u.username,
                    name: u.global_name || u.username,
                    avatar: u.avatar
                        ? "https://cdn.discordapp.com/avatars/" + u.id + "/" + u.avatar + ".png?size=64"
                        : ""
                };
            }
        } catch (e) {}
    }

    if (data || !c || !c.data) discordCache[id] = { at: Date.now(), data };
    return data || (c && c.data) || null;
}

// Chamada da API do Discord com o token do bot
async function discordBot(method, path, body) {
    if (!BOT_TOKEN) return false;
    try {
        const r = await fetchT("https://discord.com/api/v10" + path, {
            method,
            headers: {
                Authorization: "Bot " + BOT_TOKEN,
                "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!r.ok) {
            console.error("Discord " + method + " " + path + " -> " + r.status, await r.text());
        }
        return r.ok;
    } catch (e) {
        console.error("Erro Discord " + path + ":", e);
        return false;
    }
}

// "Display name (@username)" com no maximo 32 caracteres (limite do Discord)
function montarApelido(display, username) {
    const user = String(username || "").trim();
    const nome = String(display || "").trim() || user;
    const sufixo = user ? " (@" + user + ")" : "";
    const nick = nome + sufixo;
    if (nick.length <= 32) return nick;
    const sobra = 32 - sufixo.length;
    if (sobra >= 1) return nome.slice(0, sobra).trim() + sufixo;
    return ("@" + user).slice(0, 32);
}

async function aplicarNoDiscord(discordId, apelido) {
    if (!BOT_TOKEN || !SERVER_ID) return;
    const base = "/guilds/" + SERVER_ID + "/members/" + discordId;
    // cargo e apelido em paralelo
    await Promise.all([
        VERIFIED_ROLE_ID ? discordBot("PUT", base + "/roles/" + VERIFIED_ROLE_ID) : null,
        apelido ? discordBot("PATCH", base, { nick: apelido }) : null
    ]);
}

// ---------------------------------------------------------------
// Roblox (dados publicos: nome, display name e foto)
// ---------------------------------------------------------------
async function robloxInfo(id) {
    const out = { id: String(id), username: "", display: "", avatar: "" };
    // nome e foto em paralelo
    await Promise.all([
        (async () => {
            try {
                const r = await fetchT("https://users.roblox.com/v1/users/" + id);
                if (r.ok) {
                    const u = await r.json();
                    out.username = u.name || "";
                    out.display = u.displayName || u.name || "";
                }
            } catch (e) {}
        })(),
        (async () => {
            try {
                const r = await fetchT(
                    "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" +
                        id +
                        "&size=150x150&format=Png&isCircular=false"
                );
                if (r.ok) {
                    const j = await r.json();
                    const d = j.data && j.data[0];
                    if (d && d.state === "Completed" && d.imageUrl) out.avatar = d.imageUrl;
                }
            } catch (e) {}
        })()
    ]);
    return out;
}

// Atualiza o vinculo (foto, nome, username...) e reaplica cargo + apelido
async function sincronizar(discordId, robloxId) {
    const [rb, dc] = await Promise.all([robloxInfo(robloxId), buscarDiscord(discordId, true)]);

    const { data: old } = await supabase
        .from("account_links")
        .select("*")
        .eq("discord_id", String(discordId))
        .maybeSingle();

    const row = {
        discord_id: String(discordId),
        roblox_id: String(robloxId),
        roblox_username: rb.username || (old && old.roblox_username) || "",
        roblox_display: rb.display || (old && old.roblox_display) || "",
        roblox_avatar: rb.avatar || (old && old.roblox_avatar) || "",
        discord_username: (dc && dc.username) || (old && old.discord_username) || "",
        discord_name: (dc && dc.name) || (old && old.discord_name) || "",
        discord_avatar: (dc && dc.avatar) || (old && old.discord_avatar) || "",
        updated_at: new Date().toISOString()
    };

    const up = await supabase.from("account_links").upsert(row, { onConflict: "discord_id" });
    if (up.error) throw up.error;

    // Conta nova: cria o player automaticamente (Class D, Overall 69, Wage 75K)
    const { data: existe } = await supabase
        .from("players")
        .select("discord_id")
        .eq("discord_id", String(discordId))
        .maybeSingle();
    if (!existe) {
        const novo = {
            discord_id: String(discordId),
            roblox_id: String(robloxId),
            roblox_nick: row.roblox_username,
            roblox_link: "https://www.roblox.com/users/" + robloxId + "/profile",
            avatar_url: row.roblox_avatar || "",
            class: "D",
            overall: 69,
            wage: "75K",
            goals: 0,
            assists: 0,
            motms: 0,
            cleansheets: 0
        };
        let ins = await supabase.from("players").insert({ ...novo, guild_id: GUILD_ID || SERVER_ID });
        // se a tabela nao tiver a coluna guild_id, tenta de novo sem ela
        if (ins.error) ins = await supabase.from("players").insert(novo);
        if (ins.error) console.error("Erro criando player:", ins.error);
        else console.log("Player criado:", row.roblox_username);
    }

    // Se o player ja foi aprovado com esse mesmo Roblox, atualiza nick/foto na tabela players
    const upd = { roblox_link: "https://www.roblox.com/users/" + robloxId + "/profile" };
    if (row.roblox_username) upd.roblox_nick = row.roblox_username;
    if (row.roblox_avatar) upd.avatar_url = row.roblox_avatar;
    const pu = await supabase
        .from("players")
        .update(upd)
        .eq("discord_id", String(discordId))
        .eq("roblox_id", String(robloxId));
    if (pu.error) console.error("Erro atualizando players:", pu.error);

    // Cargo + apelido no servidor
    const nome = NICK_SOURCE === "discord" ? row.discord_name : row.roblox_display;
    const user = NICK_SOURCE === "discord" ? row.discord_username : row.roblox_username;
    await aplicarNoDiscord(discordId, montarApelido(nome, user));

    cache = { at: 0, data: null };
    return row;
}

async function vincular(discordId, robloxId) {
    const { data: dup } = await supabase
        .from("account_links")
        .select("discord_id")
        .eq("roblox_id", String(robloxId))
        .maybeSingle();
    if (dup && dup.discord_id !== String(discordId)) return "taken";
    await sincronizar(discordId, robloxId);
    return "ok";
}

// ---------------------------------------------------------------
// Login com Discord (passo 1)
// ---------------------------------------------------------------
app.get("/auth/login", (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET || !SECRET) {
        return res.status(500).send("Login nao configurado: faltam variaveis de ambiente.");
    }
    const state = assinar({ t: "dc", exp: Date.now() + 10 * 60 * 1000 });
    const url =
        "https://discord.com/oauth2/authorize" +
        "?client_id=" + encodeURIComponent(CLIENT_ID) +
        "&response_type=code" +
        "&scope=identify" +
        "&prompt=none" +
        "&redirect_uri=" + encodeURIComponent(REDIRECT_URI) +
        "&state=" + encodeURIComponent(state);
    res.redirect(url);
});

app.get("/auth/callback", async (req, res) => {
    try {
        const { code, state } = req.query;
        const st = verificar(state);
        if (!code || !st || st.t !== "dc") return res.redirect(SITE_URL + "/#erro");

        const tokenRes = await fetchT("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "authorization_code",
                code: String(code),
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await jsonSeguro(tokenRes);
        if (!tokenData.access_token) {
            console.error("Erro no token do Discord:", tokenData);
            return res.redirect(SITE_URL + "/#erro");
        }

        const userRes = await fetchT("https://discord.com/api/users/@me", {
            headers: { Authorization: "Bearer " + tokenData.access_token }
        });
        const u = await jsonSeguro(userRes);
        if (!u.id) return res.redirect(SITE_URL + "/#erro");

        // Sessao nova do Discord: ainda NAO passou pelo Roblox (rb: false).
        // O site vai mandar a pessoa para a etapa 2 em todo login novo.
        const sessao = assinar({
            id: u.id,
            name: u.global_name || u.username,
            username: u.username,
            avatar: u.avatar || "",
            rb: false,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000
        });

        res.redirect(SITE_URL + "/#token=" + sessao);
    } catch (e) {
        console.error("Erro /auth/callback:", e);
        res.redirect(SITE_URL + "/#erro");
    }
});

// ---------------------------------------------------------------
// Login com Roblox (passo 2)
// ---------------------------------------------------------------
// O verifier do PKCE e derivado do nonce + SECRET (sem precisar guardar nada no servidor)
function pkceVerifier(nonce) {
    return crypto.createHmac("sha256", SECRET).update("pkce:" + nonce).digest("base64url");
}

// O site chama esta rota (com o token da sessao) e recebe a URL do Roblox
app.get("/auth/roblox/start", exigirLogin, (req, res) => {
    if (!ROBLOX_CLIENT_ID || !ROBLOX_CLIENT_SECRET || !SECRET) {
        return res.status(500).json({ error: "roblox nao configurado" });
    }
    const nonce = crypto.randomBytes(16).toString("base64url");
    const challenge = crypto.createHash("sha256").update(pkceVerifier(nonce)).digest("base64url");
    const state = assinar({
        t: "rb",
        d: String(req.user.id),
        n: nonce,
        name: req.user.name || "",
        un: req.user.username || "",
        av: req.user.avatar || "",
        exp: Date.now() + 10 * 60 * 1000
    });
    const url =
        "https://apis.roblox.com/oauth/v1/authorize" +
        "?client_id=" + encodeURIComponent(ROBLOX_CLIENT_ID) +
        "&redirect_uri=" + encodeURIComponent(ROBLOX_REDIRECT_URI) +
        "&scope=" + encodeURIComponent("openid profile") +
        "&response_type=code" +
        "&code_challenge=" + encodeURIComponent(challenge) +
        "&code_challenge_method=S256" +
        "&state=" + encodeURIComponent(state);
    res.json({ url });
});

app.get("/auth/roblox/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;
        const st = verificar(state);
        if (error || !code || !st || st.t !== "rb" || !st.d || !st.n) {
            return res.redirect(SITE_URL + "/#roblox=erro");
        }

        const tokenRes = await fetchT("https://apis.roblox.com/oauth/v1/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: ROBLOX_CLIENT_ID,
                client_secret: ROBLOX_CLIENT_SECRET,
                grant_type: "authorization_code",
                code: String(code),
                redirect_uri: ROBLOX_REDIRECT_URI,
                code_verifier: pkceVerifier(st.n)
            })
        });
        const td = await jsonSeguro(tokenRes);
        if (!td.access_token) {
            console.error("Erro no token do Roblox:", td);
            return res.redirect(SITE_URL + "/#roblox=erro");
        }

        const infoRes = await fetchT("https://apis.roblox.com/oauth/v1/userinfo", {
            headers: { Authorization: "Bearer " + td.access_token }
        });
        const info = await jsonSeguro(infoRes);
        if (!info.sub) {
            console.error("Userinfo do Roblox sem sub:", info);
            return res.redirect(SITE_URL + "/#roblox=erro");
        }

        const r = await vincular(st.d, String(info.sub));
        if (r !== "ok") return res.redirect(SITE_URL + "/#roblox=taken");

        // Sessao nova, agora verificada no Roblox
        const sessao = assinar({
            id: st.d,
            name: st.name || "",
            username: st.un || "",
            avatar: st.av || "",
            rb: true,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000
        });
        res.redirect(SITE_URL + "/#token=" + sessao + "&roblox=ok");
    } catch (e) {
        console.error("Erro /auth/roblox/callback:", e);
        res.redirect(SITE_URL + "/#roblox=erro");
    }
});

// ---------------------------------------------------------------
// Dados
// ---------------------------------------------------------------
// Varias requisicoes ao mesmo tempo compartilham UMA carga (evita rebater Supabase/Discord)
function carregar() {
    if (cache.data && Date.now() - cache.at < 30000) return Promise.resolve(cache.data);
    if (!carregando) {
        carregando = montarDados().finally(() => {
            carregando = null;
        });
    }
    return carregando;
}

async function montarDados() {
    let pq = supabase.from("players").select("*");
    let tq = supabase.from("teams").select("*");
    let cq = supabase.from("contracts").select("player_id, team_role_id").eq("status", "accepted");
    let fq = supabase
        .from("fixtures")
        .select("id, home_role_id, away_role_id, match_time")
        .gte("match_time", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order("match_time", { ascending: true })
        .limit(50);
    const lq = supabase.from("account_links").select("*");

    if (GUILD_ID) {
        pq = pq.eq("guild_id", GUILD_ID);
        tq = tq.eq("guild_id", GUILD_ID);
        cq = cq.eq("guild_id", GUILD_ID);
        fq = fq.eq("guild_id", GUILD_ID);
    }

    // ligas e managers (se a tabela ainda nao existir, o site continua funcionando)
    let lgq = supabase.from("leagues").select("id, name, logo_url");
    let mq = supabase.from("manager_permissions").select("manager_id, team_role_id");
    if (GUILD_ID) {
        lgq = lgq.eq("guild_id", GUILD_ID);
        mq = mq.eq("guild_id", GUILD_ID);
    }

    const [p, t, c, f, l, lg, mg] = await Promise.all([pq, tq, cq, fq, lq, lgq, mq]);

    if (p.error || t.error || c.error || l.error) throw p.error || t.error || c.error || l.error;
    // se a tabela fixtures ainda nao existir, o site continua funcionando
    const fixData = f.error ? [] : f.data;
    if (f.error) console.error("Erro fixtures:", f.error);

    const teamByRole = {};
    t.data.forEach(x => { teamByRole[x.role_id] = x; });

    const contractByPlayer = {};
    c.data.forEach(x => { contractByPlayer[x.player_id] = x; });

    const links = {};
    l.data.forEach(x => { links[x.discord_id] = x; });

    const players = [];
    const byDiscord = {};

    p.data.forEach(x => {
        const ct = contractByPlayer[x.discord_id];
        const tm = ct ? teamByRole[ct.team_role_id] : null;

        // so usa os dados do vinculo se for o mesmo Roblox do player aprovado
        const l0 = links[x.discord_id];
        const lk = l0 && String(l0.roblox_id) === String(x.roblox_id) ? l0 : null;

        const jogador = {
            id: x.roblox_id,
            nick: (lk && lk.roblox_username) || x.roblox_nick,
            display: (lk && lk.roblox_display) || x.roblox_nick,
            robloxUser: (lk && lk.roblox_username) || x.roblox_nick,
            link: x.roblox_link || "",
            classe: x.class,
            team: tm ? tm.name : "",
            teamLogo: tm ? tm.logo_url || "" : "",
            wage: x.wage || "",
            avatar: (lk && lk.roblox_avatar) || x.avatar_url || "",
            goals: x.goals || 0,
            assists: x.assists || 0,
            motms: x.motms || 0,
            cleansheets: x.cleansheets || 0,
            overall: x.overall || 0,
            discord: {
                id: x.discord_id,
                // ja preenche com o que temos salvo; o Discord atualiza por cima
                name: (lk && lk.discord_name) || "",
                username: (lk && lk.discord_username) || "",
                avatar: (lk && lk.discord_avatar) || ""
            }
        };

        players.push(jogador);
        byDiscord[x.discord_id] = jogador;
    });

    // busca o usuario correto do Discord de cada player (em lotes, com cache)
    const ids = p.data.map(x => x.discord_id);

    for (let i = 0; i < ids.length; i += 10) {
        await Promise.all(
            ids.slice(i, i + 10).map(async id => {
                const d = await buscarDiscord(id);
                if (d) Object.assign(byDiscord[id].discord, d);
            })
        );
    }

    const leagueById = {};
    (lg.error ? [] : lg.data || []).forEach(x => { leagueById[x.id] = x; });

    const mgByTeam = {};
    (mg.error ? [] : mg.data || []).forEach(x => { mgByTeam[x.team_role_id] = x.manager_id; });

    const mgInfo = {};
    await Promise.all(
        [...new Set(Object.values(mgByTeam))].map(async id => {
            mgInfo[id] = await buscarDiscord(id);
        })
    );

    const teams = t.data.map(x => {
        const L = x.league_id ? leagueById[x.league_id] : null;
        const mid = mgByTeam[x.role_id];
        const m = mid ? mgInfo[mid] : null;
        return {
            name: x.name,
            logo: x.logo_url || "",
            league: L ? { id: L.id, name: L.name, logo: L.logo_url || "" } : null,
            manager: mid
                ? {
                      id: String(mid),
                      name: (m && m.name) || "",
                      username: (m && m.username) || "",
                      avatar: (m && m.avatar) || ""
                  }
                : null
        };
    });

    const fixtures = fixData.map(x => {
        const h = teamByRole[x.home_role_id];
        const a = teamByRole[x.away_role_id];
        return {
            id: x.id,
            time: new Date(x.match_time).getTime(),
            home: h ? h.name : "?",
            homeLogo: h ? h.logo_url || "" : "",
            away: a ? a.name : "?",
            awayLogo: a ? a.logo_url || "" : ""
        };
    });

    cache = { at: Date.now(), data: { players, teams, fixtures, byDiscord, links } };
    return cache.data;
}

app.get("/", (req, res) => {
    res.send("PML Bot online!");
});

// Para o Render / monitor de uptime
app.get("/health", (req, res) => {
    res.json({ ok: true, uptime: Math.round(process.uptime()) });
});

// semVinculo = true -> rota liberada mesmo sem Roblox vinculado
function rota(path, pegar, semVinculo) {
    app.get(path, exigirLogin, async (req, res) => {
        try {
            const d = await carregar();
            if (!semVinculo && !(req.user.rb && d.links[req.user.id])) {
                return res.status(403).json({ error: "link" });
            }
            res.json(await pegar(d, req));
        } catch (e) {
            // detalhes so no log do servidor, nunca para o navegador
            console.error("Erro " + path + ":", e);
            res.status(500).json({ error: "erro" });
        }
    });
}

rota(
    "/api/me",
    (d, req) => {
        const jogador = d.byDiscord[req.user.id] || null;
        const lk = d.links[req.user.id] || null;
        return {
            discord: {
                id: req.user.id,
                name: req.user.name,
                username: req.user.username || "",
                avatar: req.user.avatar
                    ? "https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png?size=128"
                    : ""
            },
            linked: !!(lk && req.user.rb),
            roblox: lk && req.user.rb
                ? {
                      id: lk.roblox_id,
                      username: lk.roblox_username || "",
                      display: lk.roblox_display || lk.roblox_username || "",
                      avatar: lk.roblox_avatar || "",
                      linkedAt: lk.linked_at || null,
                      syncedAt: lk.updated_at || null
                  }
                : null,
            approved: !!jogador,
            player: jogador
        };
    },
    true
);
rota("/api/players", d => d.players);
rota("/api/teams", d => d.teams);
rota("/api/fixtures", d => d.fixtures);

// Botao "Sync accounts": atualiza foto, nome, apelido e cargo (1 vez por minuto por pessoa)
const syncCooldown = {};

// limpa cooldowns antigos (evita o objeto crescer pra sempre)
setInterval(() => {
    const agora = Date.now();
    Object.keys(syncCooldown).forEach(k => {
        if (agora - syncCooldown[k] > 5 * 60 * 1000) delete syncCooldown[k];
    });
}, 10 * 60 * 1000).unref();

app.get("/api/sync", exigirLogin, async (req, res) => {
    const uid = req.user.id;
    try {
        if (!req.user.rb) return res.status(403).json({ error: "link" });

        if (Date.now() - (syncCooldown[uid] || 0) < 60 * 1000) {
            return res.status(429).json({ error: "espere" });
        }

        const { data: lk } = await supabase
            .from("account_links")
            .select("roblox_id")
            .eq("discord_id", String(uid))
            .maybeSingle();
        if (!lk) return res.status(403).json({ error: "link" });

        syncCooldown[uid] = Date.now();
        await sincronizar(uid, lk.roblox_id);
        res.json({ ok: true });
    } catch (e) {
        // se falhou, nao prende a pessoa 1 minuto
        delete syncCooldown[uid];
        console.error("Erro /api/sync:", e);
        res.status(500).json({ error: "erro" });
    }
});

// Rota inexistente
app.use((req, res) => res.status(404).json({ error: "nao encontrado" }));

app.listen(process.env.PORT || 3000, () => {
    console.log("API no ar.");
});
