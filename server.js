const express = require("express");
const supabase = require("./supabase");

const app = express();
const GUILD_ID = process.env.GUILD_ID || null;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

let cache = { at: 0, data: null };

async function carregar() {
    if (cache.data && Date.now() - cache.at < 30000) {
        return cache.data;
    }

    let pq = supabase.from("players").select("*");
    let tq = supabase.from("teams").select("name, logo_url, role_id");
    let cq = supabase
        .from("contracts")
        .select("player_id, team_role_id")
        .eq("status", "accepted");

    if (GUILD_ID) {
        pq = pq.eq("guild_id", GUILD_ID);
        tq = tq.eq("guild_id", GUILD_ID);
        cq = cq.eq("guild_id", GUILD_ID);
    }

    const [p, t, c] = await Promise.all([pq, tq, cq]);

    if (p.error || t.error || c.error) {
        throw p.error || t.error || c.error;
    }

    const teamByRole = {};
    t.data.forEach(x => {
        teamByRole[x.role_id] = x;
    });

    const contractByPlayer = {};
    c.data.forEach(x => {
        contractByPlayer[x.player_id] = x;
    });

    const players = p.data.map(x => {
        const ct = contractByPlayer[x.discord_id];
        const tm = ct ? teamByRole[ct.team_role_id] : null;
        return {
            id: x.roblox_id,
            nick: x.roblox_nick,
            link: x.roblox_link,
            classe: x.class,
            team: tm ? tm.name : "",
            wage: x.wage || "",
            avatar: x.avatar_url || ""
        };
    });

    const teams = t.data.map(x => ({
        name: x.name,
        logo: x.logo_url || ""
    }));

    cache = { at: Date.now(), data: { players, teams } };
    return cache.data;
}

app.get("/", (req, res) => {
    res.send("PML Bot online!");
});

app.get("/api/players", async (req, res) => {
    try {
        res.json((await carregar()).players);
    } catch (e) {
        console.error("Erro /api/players:", e);
        res.status(500).json({ error: "erro" });
    }
});

app.get("/api/teams", async (req, res) => {
    try {
        res.json((await carregar()).teams);
    } catch (e) {
        console.error("Erro /api/teams:", e);
        res.status(500).json({ error: "erro" });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("API no ar.");
});
