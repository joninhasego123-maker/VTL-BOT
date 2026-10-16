const express = require("express");
const crypto = require("crypto");
const supabase = require("./supabase");

const app = express();

const GUILD_ID = process.env.GUILD_ID || null;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const SECRET = process.env.SESSION_SECRET || "";
const BOT_TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN || "";
const SITE_URL = (process.env.SITE_URL || "https://pml-site-1.onrender.com").replace(/\/$/, "");
const API_URL = (
    process.env.API_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "https://vtl-bot-167.onrender.com"
).replace(/\/$/, "");
const REDIRECT_URI = API_URL + "/auth/callback";

// CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
        if (o.exp && o.exp < Date.now()) return null;
        return o;
    } catch (e) {
        return null;
    }
}

function exigirLogin(req, res, next) {
    const h = req.headers.authorization || "";
    const user = verificar(h.replace(/^Bearer\s+/i, ""));
    if (!user) return res.status(401).json({ error: "login" });
    req.user = user;
    next();
}

// Login com Discord
app.get("/auth/login", (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET || !SECRET) {
        return res.status(500).send("Login nao configurado: faltam variaveis de ambiente.");
    }
    const state = assinar({ exp: Date.now() + 10 * 60 * 1000 });
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
        if (!code || !verificar(state)) return res.redirect(SITE_URL + "/#erro");

        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
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

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error("Erro no token do Discord:", tokenData);
            return res.redirect(SITE_URL + "/#erro");
        }

        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: "Bearer " + tokenData.access_token }
        });
        const u = await userRes.json();
        if (!u.id) return res.redirect(SITE_URL + "/#erro");

        const sessao = assinar({
            id: u.id,
            name: u.global_name || u.username,
            username: u.username,
            avatar: u.avatar || "",
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000
        });

        res.redirect(SITE_URL + "/#token=" + sessao);
    } catch (e) {
        console.error("Erro /auth/callback:", e);
        res.redirect(SITE_URL + "/#erro");
    }
});

// Usuário do Discord de cada player (com cache)
const discordCache = {};

async function buscarDiscord(id) {
    const c = discordCache[id];
    if (c && Date.now() - c.at < (c.data ? 6 * 3600e3 : 5 * 60e3)) return c.data;

    let data = null;

    if (BOT_TOKEN) {
        try {
            const r = await fetch("https://discord.com/api/v10/users/" + id, {
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

    discordCache[id] = { at: Date.now(), data };
    return data;
}

// Dados
let cache = { at: 0, data: null };

async function carregar() {
    if (cache.data && Date.now() - cache.at < 30000) return cache.data;

    let pq = supabase.from("players").select("*");
    let tq = supabase.from("teams").select("name, logo_url, role_id");
    let cq = supabase.from("contracts").select("player_id, team_role_id").eq("status", "accepted");
    let fq = supabase
        .from("fixtures")
        .select("id, home_role_id, away_role_id, match_time")
        .gte("match_time", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order("match_time", { ascending: true })
        .limit(50);

    if (GUILD_ID) {
        pq = pq.eq("guild_id", GUILD_ID);
        tq = tq.eq("guild_id", GUILD_ID);
        cq = cq.eq("guild_id", GUILD_ID);
        fq = fq.eq("guild_id", GUILD_ID);
    }

    const [p, t, c, f] = await Promise.all([pq, tq, cq, fq]);

    if (p.error || t.error || c.error) throw p.error || t.error || c.error;
    // se a tabela fixtures ainda nao existir, o site continua funcionando
    const fixData = f.error ? [] : f.data;
    if (f.error) console.error("Erro fixtures:", f.error);

    const teamByRole = {};
    t.data.forEach(x => { teamByRole[x.role_id] = x; });

    const contractByPlayer = {};
    c.data.forEach(x => { contractByPlayer[x.player_id] = x; });

    const players = [];
    const byDiscord = {};

    p.data.forEach(x => {
        const ct = contractByPlayer[x.discord_id];
        const tm = ct ? teamByRole[ct.team_role_id] : null;

        const jogador = {
            id: x.roblox_id,
            nick: x.roblox_nick,
            link: x.roblox_link,
            classe: x.class,
            team: tm ? tm.name : "",
            teamLogo: tm ? tm.logo_url || "" : "",
            wage: x.wage || "",
            avatar: x.avatar_url || "",
            goals: x.goals || 0,
            assists: x.assists || 0,
            motms: x.motms || 0,
            cleansheets: x.cleansheets || 0,
            overall: x.overall || 0,
            discord: { id: x.discord_id, name: "", username: "", avatar: "" }
        };

        players.push(jogador);
        byDiscord[x.discord_id] = jogador;
    });

    // busca o usuário correto do Discord de cada player (em lotes, com cache)
    const ids = p.data.map(x => x.discord_id);

    for (let i = 0; i < ids.length; i += 10) {
        await Promise.all(
            ids.slice(i, i + 10).map(async id => {
                const d = await buscarDiscord(id);
                if (d) Object.assign(byDiscord[id].discord, d);
            })
        );
    }

    const teams = t.data.map(x => ({ name: x.name, logo: x.logo_url || "" }));

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

    cache = { at: Date.now(), data: { players, teams, fixtures, byDiscord } };
    return cache.data;
}

app.get("/", (req, res) => {
    res.send("PML Bot online!");
});

function rota(path, pegar) {
    app.get(path, exigirLogin, async (req, res) => {
        try {
            res.json(await pegar(await carregar(), req));
        } catch (e) {
            console.error("Erro " + path + ":", e);
            res.status(500).json({ error: "erro", detalhe: (e && e.message) || String(e) });
        }
    });
}

rota("/api/me", (d, req) => {
    const jogador = d.byDiscord[req.user.id] || null;
    return {
        discord: {
            id: req.user.id,
            name: req.user.name,
            username: req.user.username || "",
            avatar: req.user.avatar
                ? "https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png?size=128"
                : ""
        },
        approved: !!jogador,
        player: jogador
    };
});
rota("/api/players", d => d.players);
rota("/api/teams", d => d.teams);
rota("/api/fixtures", d => d.fixtures);

app.listen(process.env.PORT || 3000, () => {
    console.log("API no ar.");
});
