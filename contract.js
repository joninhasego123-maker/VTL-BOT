const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require("discord.js");

const supabase = require("./supabase");

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const CONTRACT_CHANNEL_ID = "1552636518886019072";
const CONTRACT_LOG_CHANNEL_ID = "1552634532262584391";

const SITE_URL = "https://pml-site-1.onrender.com";

const POSITIONS = [
    "Goleiro",
    "Zagueiro",
    "Volante",
    "Meia",
    "Atacante"
];

const FUNCTIONS = [
    "Titular",
    "Reserva",
    "Assist Manager"
];

const CLASSES = [
    "D", "C-", "C", "C+", "B-", "B", "B+",
    "A-", "A", "A+", "S-", "S", "S+", "X"
];

const STATUS_CONTRATO = {
    pending: "⏳ Aguardando resposta do jogador.",
    accepted: "✅ Contrato aceito pelo jogador.",
    declined: "❌ Contrato recusado pelo jogador.",
    released: "🔓 Jogador liberado do time."
};

const STATUS_LOG = {
    accepted: "✅ ACEITO",
    declined: "❌ RECUSADO",
    released: "🔓 LIBERADO"
};

// ======================================================
// AJUDANTES
// ======================================================

function verificarCanal(interaction) {
    return interaction.channelId === CONTRACT_CHANNEL_ID;
}

function erro(interaction, content) {
    return interaction.reply({ content, ephemeral: true });
}

function texto(container, content) {
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
    );
}

function separador(container) {
    container.addSeparatorComponents(new SeparatorBuilder());
}

function idDe(valor) {
    if (valor && valor.id) return valor.id;
    return String(valor).replace(/\D/g, "");
}

// Aceita "<t:1760634000:F>", "1760634000" ou milissegundos.
// Retorna segundos (unix) ou null se inválido.
function lerTimestamp(entrada) {

    const m = String(entrada || "").match(/\d{9,13}/);

    if (!m) return null;

    let n = Number(m[0]);

    if (m[0].length >= 13) n = Math.floor(n / 1000);

    if (!Number.isFinite(n) || n <= 0) return null;

    return n;

}

// Texto do time com a logo à direita (se existir)
function blocoTime(container, content, logoUrl) {

    if (logoUrl) {

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(content)
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(logoUrl)
                )
        );

    } else {

        texto(container, content);

    }

}

function textoContrato(teamName, position, funcao) {

    return (
        `**Time:** ${teamName}\n` +
        `**Posição:** ${position}\n` +
        `**Função:** ${funcao}`
    );

}

// ======================================================
// CONTAINER DO CONTRATO
// ======================================================

function criarContratoContainer({
    manager,
    player,
    teamName,
    position,
    funcao,
    contractId,
    status = "pending",
    logoUrl = null
}) {

    const container = new ContainerBuilder();

    texto(container, "## 📄 CONTRATO OFICIAL");

    texto(
        container,
        `**Manager:** ${manager}\n` +
        `**Manager ID:** \`${idDe(manager)}\``
    );

    separador(container);

    texto(
        container,
        `**Jogador:** ${player}\n` +
        `**Player ID:** \`${idDe(player)}\``
    );

    separador(container);

    blocoTime(
        container,
        textoContrato(teamName, position, funcao),
        logoUrl
    );

    separador(container);

    texto(
        container,
        `**Status:** ${STATUS_CONTRATO[status] || STATUS_CONTRATO.pending}`
    );

    if (status === "pending") {

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId(`contract_accept_${contractId}`)
                    .setLabel("Aceitar")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`contract_decline_${contractId}`)
                    .setLabel("Recusar")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)

            )
        );

    }

    texto(container, "-# PML • CONTRACT SYSTEM");

    return container;

}

// ======================================================
// REGISTRAR LOG
// ======================================================

async function registrarContrato({ client, contract, status }) {

    try {

        const guild = await client.guilds
            .fetch(contract.guild_id)
            .catch(() => null);

        if (!guild) {
            console.error("❌ Servidor do contrato não encontrado.");
            return;
        }

        const logChannel = await guild.channels
            .fetch(CONTRACT_LOG_CHANNEL_ID)
            .catch(() => null);

        if (!logChannel) {
            console.error(
                `❌ Canal de logs não encontrado: ${CONTRACT_LOG_CHANNEL_ID}`
            );
            return;
        }

        const manager = await client.users
            .fetch(contract.manager_id)
            .catch(() => null);

        const player = await client.users
            .fetch(contract.player_id)
            .catch(() => null);

        const { data: team } = await supabase
            .from("teams")
            .select("name, logo_url, role_id")
            .eq("guild_id", contract.guild_id)
            .eq("role_id", contract.team_role_id)
            .maybeSingle();

        const teamName = team?.name || "Time não encontrado";

        const container = new ContainerBuilder();

        texto(container, "## 📋 RESULTADO DO CONTRATO");

        texto(
            container,
            `**Manager:** ${manager || `<@${contract.manager_id}>`}\n` +
            `**Manager ID:** \`${contract.manager_id}\``
        );

        separador(container);

        texto(
            container,
            `**Jogador:** ${player || `<@${contract.player_id}>`}\n` +
            `**Player ID:** \`${contract.player_id}\``
        );

        separador(container);

        blocoTime(
            container,
            textoContrato(
                teamName,
                contract.position,
                contract.function
            ),
            team?.logo_url
        );

        separador(container);

        texto(
            container,
            `**Status:** ${STATUS_LOG[status] || "❓ DESCONHECIDO"}`
        );

        separador(container);

        texto(container, "-# PML • CONTRACT SYSTEM");

        await logChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        console.log(
            `✅ Resultado do contrato ${contract.id} enviado para os logs.`
        );

    } catch (error) {

        console.error(
            "❌ Erro ao registrar resultado do contrato:",
            error
        );

    }

}

// ======================================================
// DEFINIÇÃO DOS COMANDOS
// ======================================================

const criarTimeCommand =
    new SlashCommandBuilder()
        .setName("criartime")
        .setDescription("Cadastra um novo time na PML.")
        .addStringOption(o => o
            .setName("nome")
            .setDescription("Nome do time.")
            .setRequired(true))
        .addAttachmentOption(o => o
            .setName("logo")
            .setDescription("Imagem do logo do time.")
            .setRequired(true))
        .addRoleOption(o => o
            .setName("cargo")
            .setDescription("Cargo que representa o time.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const excluirTimeCommand =
    new SlashCommandBuilder()
        .setName("excluirtime")
        .setDescription("Exclui um time cadastrado na PML.")
        .addRoleOption(o => o
            .setName("cargo")
            .setDescription("Cargo do time que será excluído.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const permCommand =
    new SlashCommandBuilder()
        .setName("perm")
        .setDescription("Dá permissão de Manager para um usuário.")
        .addUserOption(o => o
            .setName("manager")
            .setDescription("Usuário que será Manager.")
            .setRequired(true))
        .addRoleOption(o => o
            .setName("time")
            .setDescription("Cargo do time.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const unpermCommand =
    new SlashCommandBuilder()
        .setName("unperm")
        .setDescription("Remove a permissão de Manager.")
        .addUserOption(o => o
            .setName("manager")
            .setDescription("Manager que perderá a permissão.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const permlistCommand =
    new SlashCommandBuilder()
        .setName("permlist")
        .setDescription("Lista os Managers autorizados.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const aprovarCommand =
    new SlashCommandBuilder()
        .setName("aprovar")
        .setDescription("Aprova um jogador na PML.")
        .addUserOption(o => o
            .setName("membro")
            .setDescription("Membro do Discord.")
            .setRequired(true))
        .addStringOption(o => o
            .setName("nick")
            .setDescription("Nick no Roblox.")
            .setRequired(true))
        .addStringOption(o => o
            .setName("link")
            .setDescription("Link do perfil do Roblox.")
            .setRequired(true))
        .addStringOption(o => o
            .setName("classe")
            .setDescription("Classe do jogador.")
            .setRequired(true)
            .addChoices(...CLASSES.map(c => ({ name: c, value: c }))))
        .addStringOption(o => o
            .setName("wage")
            .setDescription("Salário. Ex: 75K")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const infoCommand =
    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Mostra o perfil de um jogador da PML.")
        .addUserOption(o => o
            .setName("membro")
            .setDescription("Membro que você quer ver. Se vazio, mostra o seu.")
            .setRequired(false));

const fixturesCommand =
    new SlashCommandBuilder()
        .setName("fixtures")
        .setDescription("Marca um jogo nas próximas fixtures.")
        .addRoleOption(o => o
            .setName("home")
            .setDescription("Cargo do time da casa (time já criado).")
            .setRequired(true))
        .addRoleOption(o => o
            .setName("away")
            .setDescription("Cargo do time visitante (time já criado).")
            .setRequired(true))
        .addStringOption(o => o
            .setName("data")
            .setDescription("Timestamp do jogo. Ex: <t:1760634000:F> ou 1760634000")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const contractCommand =
    new SlashCommandBuilder()
        .setName("contract")
        .setDescription("Envia um contrato para um jogador.")
        .addUserOption(o => o
            .setName("player")
            .setDescription("Jogador que receberá o contrato.")
            .setRequired(true))
        .addStringOption(o => o
            .setName("posicao")
            .setDescription("Posição do jogador.")
            .setRequired(true)
            .addChoices(...POSITIONS.map(p => ({ name: p, value: p }))))
        .addStringOption(o => o
            .setName("funcao")
            .setDescription("Função do jogador.")
            .setRequired(true)
            .addChoices(...FUNCTIONS.map(f => ({ name: f, value: f }))));

const releaseCommand =
    new SlashCommandBuilder()
        .setName("release")
        .setDescription("Libera um jogador do seu time.")
        .addUserOption(o => o
            .setName("player")
            .setDescription("Jogador que será liberado.")
            .setRequired(true));

const autoreleaseCommand =
    new SlashCommandBuilder()
        .setName("autorelease")
        .setDescription("Sai automaticamente do seu time.");

// ======================================================
// CARGOS
// ======================================================

async function removerCargoTime({ guild, playerId, roleId }) {

    try {

        const member = await guild.members
            .fetch(playerId)
            .catch(() => null);

        if (!member) return false;

        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
        }

        return true;

    } catch (error) {

        console.error("❌ Erro ao remover cargo do jogador:", error);
        return false;

    }

}

async function adicionarCargoTime({ guild, playerId, roleId }) {

    try {

        const member = await guild.members
            .fetch(playerId)
            .catch(() => null);

        if (!member) return false;

        if (!member.roles.cache.has(roleId)) {
            await member.roles.add(roleId);
        }

        return true;

    } catch (error) {

        console.error("❌ Erro ao adicionar cargo do time:", error);
        return false;

    }

}

// ======================================================
// EXECUTAR COMANDOS
// ======================================================

async function executarComando(interaction) {

    const nome = interaction.commandName;

    // Comandos de administrador
    const SO_ADMIN = {
        criartime: "❌ Você precisa ser administrador para criar um time.",
        excluirtime: "❌ Você precisa ser administrador para excluir um time.",
        perm: "❌ Você precisa ser administrador.",
        unperm: "❌ Você precisa ser administrador.",
        permlist: "❌ Você precisa ser administrador.",
        aprovar: "❌ Você precisa ser administrador.",
        fixtures: "❌ Você precisa ser administrador para marcar jogos."
    };

    if (
        SO_ADMIN[nome] &&
        !interaction.memberPermissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return erro(interaction, SO_ADMIN[nome]);
    }

    // ==================================================
    // /CRIARTIME
    // ==================================================

    if (nome === "criartime") {

        const nomeTime = interaction.options.getString("nome").trim();
        const logo = interaction.options.getAttachment("logo");
        const cargo = interaction.options.getRole("cargo");

        if (!logo) {
            return erro(
                interaction,
                "❌ Você precisa enviar uma imagem como logo."
            );
        }

        const tiposPermitidos = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif"
        ];

        if (
            logo.contentType &&
            !tiposPermitidos.includes(logo.contentType)
        ) {
            return erro(
                interaction,
                "❌ O logo precisa ser uma imagem PNG, JPG, WEBP ou GIF."
            );
        }

        const { data: timeExistente, error: buscaError } =
            await supabase
                .from("teams")
                .select("id, name")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", cargo.id)
                .maybeSingle();

        if (buscaError) {
            console.error("❌ Erro ao verificar time:", buscaError);
            return erro(
                interaction,
                "❌ Não foi possível verificar os times cadastrados."
            );
        }

        if (timeExistente) {
            return erro(
                interaction,
                `❌ O cargo ${cargo} já está cadastrado como o time **${timeExistente.name}**.`
            );
        }

        const { data: nomeExistente, error: nomeError } =
            await supabase
                .from("teams")
                .select("id")
                .ilike("name", nomeTime)
                .eq("guild_id", interaction.guildId)
                .maybeSingle();

        if (nomeError) {
            console.error("❌ Erro ao verificar nome:", nomeError);
            return erro(
                interaction,
                "❌ Não foi possível verificar o nome do time."
            );
        }

        if (nomeExistente) {
            return erro(
                interaction,
                "❌ Já existe um time com esse nome neste servidor."
            );
        }

        const { data: time, error: insertError } =
            await supabase
                .from("teams")
                .insert({
                    guild_id: interaction.guildId,
                    name: nomeTime,
                    logo_url: logo.url,
                    role_id: cargo.id,
                    created_by: interaction.user.id
                })
                .select()
                .single();

        if (insertError) {
            console.error("❌ Erro ao criar time:", insertError);
            return erro(
                interaction,
                "❌ Não foi possível cadastrar o time no Supabase."
            );
        }

        const container = new ContainerBuilder();

        texto(
            container,
            "## ⚽ TIME CADASTRADO\n\n" +
            `**Nome:** ${time.name}\n` +
            `**Cargo:** ${cargo}\n` +
            `**Criado por:** ${interaction.user}\n` +
            `**ID:** \`${time.id}\``
        );

        separador(container);

        texto(container, "-# PML • CONTRACT SYSTEM");

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    }

    // ==================================================
    // /EXCLUIRTIME
    // ==================================================

    if (nome === "excluirtime") {

        const cargo = interaction.options.getRole("cargo");

        const { data: team, error: teamError } =
            await supabase
                .from("teams")
                .select("*")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", cargo.id)
                .maybeSingle();

        if (teamError) {
            console.error("❌ Erro ao buscar time:", teamError);
            return erro(interaction, "❌ Não foi possível verificar o time.");
        }

        if (!team) {
            return erro(
                interaction,
                "❌ Esse cargo não está cadastrado como um time da PML."
            );
        }

        const { data: contracts, error: contractsError } =
            await supabase
                .from("contracts")
                .select("id, player_id")
                .eq("guild_id", interaction.guildId)
                .eq("team_role_id", cargo.id)
                .eq("status", "accepted");

        if (contractsError) {
            console.error(
                "❌ Erro ao buscar jogadores do time:",
                contractsError
            );
            return erro(
                interaction,
                "❌ Não foi possível verificar os jogadores do time."
            );
        }

        for (const contract of contracts || []) {

            await removerCargoTime({
                guild: interaction.guild,
                playerId: contract.player_id,
                roleId: cargo.id
            });

            await supabase
                .from("contracts")
                .update({ status: "released" })
                .eq("id", contract.id);

        }

        const { error: permissionError } = await supabase
            .from("manager_permissions")
            .delete()
            .eq("guild_id", interaction.guildId)
            .eq("team_role_id", cargo.id);

        if (permissionError) {
            console.error("❌ Erro ao remover permissões:", permissionError);
        }

        // remove também os jogos marcados desse time
        await supabase
            .from("fixtures")
            .delete()
            .eq("guild_id", interaction.guildId)
            .or(`home_role_id.eq.${cargo.id},away_role_id.eq.${cargo.id}`);

        const { error: deleteError } = await supabase
            .from("teams")
            .delete()
            .eq("id", team.id);

        if (deleteError) {
            console.error("❌ Erro ao excluir time:", deleteError);
            return erro(interaction, "❌ Não foi possível excluir o time.");
        }

        return erro(
            interaction,
            `✅ O time **${team.name}** foi excluído da PML.\n` +
            `👥 ${contracts?.length || 0} jogador(es) foram liberados e tiveram o cargo removido.`
        );

    }

    // ==================================================
    // /PERM
    // ==================================================

    if (nome === "perm") {

        const manager = interaction.options.getUser("manager");
        const teamRole = interaction.options.getRole("time");

        const { data: team, error: teamError } =
            await supabase
                .from("teams")
                .select("*")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", teamRole.id)
                .maybeSingle();

        if (teamError) {
            console.error("❌ Erro ao verificar time:", teamError);
            return erro(interaction, "❌ Não foi possível verificar o time.");
        }

        if (!team) {
            return erro(
                interaction,
                "❌ Esse cargo não está cadastrado como um time da PML.\n\n" +
                "Cadastre primeiro usando `/criartime`."
            );
        }

        const { error } = await supabase
            .from("manager_permissions")
            .upsert(
                {
                    guild_id: interaction.guildId,
                    manager_id: manager.id,
                    team_role_id: teamRole.id
                },
                { onConflict: "guild_id,manager_id" }
            );

        if (error) {
            console.error("❌ Erro no /perm:", error);
            return erro(interaction, "❌ Não foi possível salvar a permissão.");
        }

        return erro(
            interaction,
            `✅ ${manager} agora é Manager do time **${team.name}**.`
        );

    }

    // ==================================================
    // /UNPERM
    // ==================================================

    if (nome === "unperm") {

        const manager = interaction.options.getUser("manager");

        const { error } = await supabase
            .from("manager_permissions")
            .delete()
            .eq("guild_id", interaction.guildId)
            .eq("manager_id", manager.id);

        if (error) {
            console.error("❌ Erro no /unperm:", error);
            return erro(interaction, "❌ Não foi possível remover a permissão.");
        }

        return erro(
            interaction,
            `✅ A permissão de ${manager} foi removida.`
        );

    }

    // ==================================================
    // /PERMLIST
    // ==================================================

    if (nome === "permlist") {

        const { data, error } = await supabase
            .from("manager_permissions")
            .select("manager_id, team_role_id")
            .eq("guild_id", interaction.guildId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("❌ Erro no /permlist:", error);
            return erro(interaction, "❌ Não foi possível carregar a lista.");
        }

        if (!data || data.length === 0) {
            return erro(
                interaction,
                "📋 Nenhum Manager possui permissão neste servidor."
            );
        }

        let lista = "";

        for (const permission of data) {

            const manager = await interaction.client.users
                .fetch(permission.manager_id)
                .catch(() => null);

            const role = interaction.guild.roles.cache.get(
                permission.team_role_id
            );

            const { data: team } = await supabase
                .from("teams")
                .select("name")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", permission.team_role_id)
                .maybeSingle();

            lista +=
                `👤 **Manager:** ${manager ? manager : `<@${permission.manager_id}>`}\n` +
                `⚽ **Time:** ${team?.name || role?.name || "Desconhecido"}\n\n`;

        }

        return erro(
            interaction,
            "## 📋 MANAGERS AUTORIZADOS\n\n" +
            lista +
            "\n-# PML • CONTRACT SYSTEM"
        );

    }

    // ==================================================
    // /APROVAR
    // ==================================================

    if (nome === "aprovar") {

        const membro = interaction.options.getUser("membro");
        const nick = interaction.options.getString("nick").trim();
        const link = interaction.options.getString("link").trim();
        const classe = interaction.options.getString("classe");
        const wage = interaction.options.getString("wage").trim();

        const match = link.match(
            /roblox\.com\/(?:[a-z]{2}\/)?users\/(\d+)/i
        );

        if (!match) {
            return erro(
                interaction,
                "❌ Link inválido. Use: https://www.roblox.com/users/ID/profile"
            );
        }

        const robloxId = match[1];

        let avatar = null;

        try {

            const r = await fetch(
                "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
                `?userIds=${robloxId}&size=150x150&format=Png`
            );

            const j = await r.json();

            avatar = j?.data?.[0]?.imageUrl || null;

        } catch (e) {

            console.log("⚠️ Não foi possível buscar o avatar do Roblox.");

        }

        const { error } = await supabase
            .from("players")
            .upsert(
                {
                    guild_id: interaction.guildId,
                    discord_id: membro.id,
                    roblox_id: robloxId,
                    roblox_nick: nick,
                    roblox_link: link,
                    class: classe,
                    wage: wage,
                    avatar_url: avatar,
                    approved_by: interaction.user.id
                },
                { onConflict: "guild_id,discord_id" }
            );

        if (error) {
            console.error("❌ Erro no /aprovar:", error);
            return erro(interaction, "❌ Não foi possível aprovar o jogador.");
        }

        // ---------- DM para o jogador aprovado ----------

        const dmContainer = new ContainerBuilder();

        texto(
            dmContainer,
            "## ✅ Você foi aprovado na PML!\n" +
            `> **Username:** ${nick}\n` +
            `> **Link:** ${link}\n` +
            `> **Class:** ${classe}`
        );

        separador(dmContainer);

        texto(
            dmContainer,
            `-# Para mais informações entre no [SITE](${SITE_URL}) da PML.`
        );

        let dmEnviada = true;

        try {

            await membro.send({
                components: [dmContainer],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (e) {

            dmEnviada = false;
            console.log(`⚠️ Não foi possível enviar DM para ${membro.tag}.`);

        }

        return interaction.reply({
            content:
                `✅ ${membro} aprovado como **${nick}** (classe **${classe}**, wage **${wage}**).` +
                (dmEnviada
                    ? ""
                    : "\n⚠️ Não consegui enviar a DM, o jogador está com as mensagens privadas fechadas.")
        });

    }

    // ==================================================
    // /FIXTURES
    // ==================================================

    if (nome === "fixtures") {

        const homeRole = interaction.options.getRole("home");
        const awayRole = interaction.options.getRole("away");
        const dataTxt = interaction.options.getString("data");

        if (homeRole.id === awayRole.id) {
            return erro(
                interaction,
                "❌ O time da casa e o visitante não podem ser o mesmo."
            );
        }

        const segundos = lerTimestamp(dataTxt);

        if (!segundos) {
            return erro(
                interaction,
                "❌ Data inválida. Use um timestamp, ex: `<t:1760634000:F>` ou `1760634000`."
            );
        }

        if (segundos * 1000 < Date.now() - 60 * 1000) {
            return erro(
                interaction,
                "❌ Essa data já passou. Confira o timestamp."
            );
        }

        const { data: times, error: timesError } =
            await supabase
                .from("teams")
                .select("name, logo_url, role_id")
                .eq("guild_id", interaction.guildId)
                .in("role_id", [homeRole.id, awayRole.id]);

        if (timesError) {
            console.error("❌ Erro ao buscar times da fixture:", timesError);
            return erro(
                interaction,
                "❌ Não foi possível verificar os times."
            );
        }

        const home = (times || []).find(t => t.role_id === homeRole.id);
        const away = (times || []).find(t => t.role_id === awayRole.id);

        if (!home || !away) {
            return erro(
                interaction,
                "❌ Os dois cargos precisam ser de times cadastrados com `/criartime`."
            );
        }

        const { data: jogo, error: insertError } =
            await supabase
                .from("fixtures")
                .insert({
                    guild_id: interaction.guildId,
                    home_role_id: homeRole.id,
                    away_role_id: awayRole.id,
                    match_time: new Date(segundos * 1000).toISOString(),
                    created_by: interaction.user.id
                })
                .select()
                .single();

        if (insertError) {
            console.error("❌ Erro ao criar fixture:", insertError);
            return erro(
                interaction,
                "❌ Não foi possível marcar o jogo. A tabela `fixtures` existe no Supabase?"
            );
        }

        const container = new ContainerBuilder();

        texto(container, "## 📅 JOGO MARCADO");

        blocoTime(
            container,
            `**Home:** ${home.name}`,
            home.logo_url
        );

        blocoTime(
            container,
            `**Away:** ${away.name}`,
            away.logo_url
        );

        separador(container);

        texto(
            container,
            `**Data:** <t:${segundos}:F> (<t:${segundos}:R>)\n` +
            `**ID:** \`${jogo.id}\``
        );

        separador(container);

        texto(container, "-# PML • Fixtures");

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    }

    // ==================================================
    // /INFO
    // ==================================================

    if (nome === "info") {

        const membro =
            interaction.options.getUser("membro") || interaction.user;

        const { data: player, error: playerError } =
            await supabase
                .from("players")
                .select("*")
                .eq("guild_id", interaction.guildId)
                .eq("discord_id", membro.id)
                .maybeSingle();

        if (playerError) {
            console.error("❌ Erro no /info:", playerError);
            return erro(
                interaction,
                "❌ Não foi possível buscar o jogador."
            );
        }

        if (!player) {
            return erro(
                interaction,
                `❌ ${membro} ainda não foi aprovado na PML, então não dá pra usar o /info nele.`
            );
        }

        // Time atual (contrato aceito)
        let timeNome = "Não possui.";

        const { data: contrato } = await supabase
            .from("contracts")
            .select("team_role_id")
            .eq("guild_id", interaction.guildId)
            .eq("player_id", membro.id)
            .eq("status", "accepted")
            .limit(1)
            .maybeSingle();

        if (contrato) {

            const { data: time } = await supabase
                .from("teams")
                .select("name")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", contrato.team_role_id)
                .maybeSingle();

            if (time) timeNome = time.name;

        }

        const goals = player.goals || 0;
        const assists = player.assists || 0;
        const motms = player.motms || 0;
        const cleansheets = player.cleansheets || 0;
        const temStats =
            goals > 0 || assists > 0 || motms > 0 || cleansheets > 0;

        const foto =
            player.avatar_url ||
            membro.displayAvatarURL({ extension: "png", size: 256 });

        const container = new ContainerBuilder();

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "👤 **Jogador**\n" +
                        `\`${membro.username}\` (\`${membro.id}\`)`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(foto)
                )
        );

        let conteudo =
            "ℹ️ **Class**\n" +
            `${player.class}\n\n` +
            "👥 **Time**\n" +
            `${timeNome}`;

        if (temStats) {
            conteudo +=
                "\n\n📈 **Stats**\n" +
                `**Goals:** ${goals}\n` +
                `**Assists:** ${assists}\n` +
                `**Clean sheets:** ${cleansheets}\n` +
                `**MOTM's:** ${motms}`;
        }

        texto(container, conteudo);

        separador(container);

        // Botões só aparecem para staff
        if (
            interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`info_edit_perfil_${membro.id}`)
                        .setLabel("Editar perfil (staff)")
                        .setEmoji("✏️")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`info_edit_stats_${membro.id}`)
                        .setLabel("Editar stats (staff)")
                        .setEmoji("📈")
                        .setStyle(ButtonStyle.Secondary)
                )
            );

            separador(container);

        }

        texto(container, "-# PML • Infos");

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    }

    // ==================================================
    // CANAL DOS COMANDOS DE CONTRATO
    // ==================================================

    if (
        (nome === "contract" ||
            nome === "release" ||
            nome === "autorelease") &&
        !verificarCanal(interaction)
    ) {
        return erro(
            interaction,
            `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`
        );
    }

    // ==================================================
    // /CONTRACT
    // ==================================================

    if (nome === "contract") {

        const managerId = interaction.user.id;
        const player = interaction.options.getUser("player");
        const position = interaction.options.getString("posicao");
        const funcao = interaction.options.getString("funcao");

        const { data: permission, error: permissionError } =
            await supabase
                .from("manager_permissions")
                .select("manager_id, team_role_id")
                .eq("guild_id", interaction.guildId)
                .eq("manager_id", managerId)
                .maybeSingle();

        if (permissionError) {
            console.error("❌ Erro ao verificar permissão:", permissionError);
            return erro(
                interaction,
                "❌ Erro ao verificar sua permissão de Manager."
            );
        }

        if (!permission) {
            return erro(interaction, "❌ Você não possui permissão de Manager.");
        }

        const teamRole = interaction.guild.roles.cache.get(
            permission.team_role_id
        );

        if (!teamRole) {
            return erro(interaction, "❌ O cargo do seu time não foi encontrado.");
        }

        const { data: team, error: teamError } =
            await supabase
                .from("teams")
                .select("id, name, logo_url, role_id")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", teamRole.id)
                .maybeSingle();

        if (teamError) {
            console.error("❌ Erro ao verificar time:", teamError);
            return erro(
                interaction,
                "❌ Não foi possível verificar o cadastro do seu time."
            );
        }

        if (!team) {
            return erro(interaction, "❌ Seu time não está cadastrado na PML.");
        }

        // ---------- jogador precisa estar aprovado na liga ----------

        const { data: jogadorAprovado, error: aprovadoError } =
            await supabase
                .from("players")
                .select("discord_id")
                .eq("guild_id", interaction.guildId)
                .eq("discord_id", player.id)
                .maybeSingle();

        if (aprovadoError) {
            console.error("❌ Erro ao verificar aprovação:", aprovadoError);
            return erro(
                interaction,
                "❌ Não foi possível verificar se o jogador foi aprovado."
            );
        }

        if (!jogadorAprovado) {
            return erro(
                interaction,
                `❌ ${player} ainda não foi aprovado na PML, então não pode receber contrato.`
            );
        }

        // ---------- contrato ativo ----------

        const { data: existingContract, error: existingError } =
            await supabase
                .from("contracts")
                .select("*")
                .eq("guild_id", interaction.guildId)
                .eq("player_id", player.id)
                .eq("status", "accepted")
                .limit(1)
                .maybeSingle();

        if (existingError) {
            console.error(
                "❌ Erro ao verificar contrato existente:",
                existingError
            );
            return erro(
                interaction,
                "❌ Não foi possível verificar os contratos do jogador."
            );
        }

        if (existingContract) {
            return erro(
                interaction,
                "❌ Esse jogador já possui um contrato ativo."
            );
        }

        const { data: contract, error: contractError } =
            await supabase
                .from("contracts")
                .insert({
                    guild_id: interaction.guildId,
                    manager_id: managerId,
                    manager_role_id: teamRole.id,
                    player_id: player.id,
                    team_role_id: teamRole.id,
                    position: position,
                    function: funcao,
                    status: "pending"
                })
                .select()
                .single();

        if (contractError) {
            console.error("❌ Erro ao criar contrato:", contractError);
            return erro(interaction, "❌ Não foi possível criar o contrato.");
        }

        const dadosContrato = {
            manager: interaction.user,
            player: player,
            teamName: team.name,
            position: position,
            funcao: funcao,
            contractId: contract.id,
            status: "pending",
            logoUrl: team.logo_url
        };

        const contractMessage = await interaction.channel.send({
            components: [criarContratoContainer(dadosContrato)],
            flags: MessageFlags.IsComponentsV2
        });

        await supabase
            .from("contracts")
            .update({
                message_id: contractMessage.id,
                channel_id: interaction.channelId
            })
            .eq("id", contract.id);

        try {

            const dm = await player.createDM();

            await dm.send({
                components: [criarContratoContainer(dadosContrato)],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {

            console.log(
                `⚠️ Não foi possível enviar DM para ${player.tag}.`
            );

            const fallbackChannel = await interaction.guild.channels
                .fetch(CONTRACT_LOG_CHANNEL_ID)
                .catch(() => null);

            if (fallbackChannel) {

                await fallbackChannel
                    .send({
                        content:
                            `⚠️ Não foi possível enviar o contrato por DM para ${player}.`
                    })
                    .catch(() => {});

            }

        }

        return erro(interaction, `✅ Contrato enviado para ${player}.`);

    }

    // ==================================================
    // /RELEASE
    // ==================================================

    if (nome === "release") {

        const managerId = interaction.user.id;
        const player = interaction.options.getUser("player");

        const { data: permission, error: permissionError } =
            await supabase
                .from("manager_permissions")
                .select("team_role_id")
                .eq("guild_id", interaction.guildId)
                .eq("manager_id", managerId)
                .maybeSingle();

        if (permissionError) {
            return erro(interaction, "❌ Erro ao verificar sua permissão.");
        }

        if (!permission) {
            return erro(interaction, "❌ Você não possui permissão de Manager.");
        }

        const { data: contract, error: contractError } =
            await supabase
                .from("contracts")
                .select("*")
                .eq("guild_id", interaction.guildId)
                .eq("player_id", player.id)
                .eq("team_role_id", permission.team_role_id)
                .eq("status", "accepted")
                .limit(1)
                .maybeSingle();

        if (contractError) {
            console.error("❌ Erro ao buscar contrato:", contractError);
            return erro(
                interaction,
                "❌ Não foi possível encontrar o contrato."
            );
        }

        if (!contract) {
            return erro(
                interaction,
                "❌ Esse jogador não possui contrato com seu time."
            );
        }

        const removido = await removerCargoTime({
            guild: interaction.guild,
            playerId: player.id,
            roleId: permission.team_role_id
        });

        if (!removido) {
            return erro(
                interaction,
                "❌ Não foi possível remover o cargo do jogador."
            );
        }

        const { error: releaseError } = await supabase
            .from("contracts")
            .update({ status: "released" })
            .eq("id", contract.id);

        if (releaseError) {
            console.error("❌ Erro ao liberar jogador:", releaseError);
            return erro(
                interaction,
                "❌ Não foi possível atualizar o contrato."
            );
        }

        return erro(
            interaction,
            `✅ ${player} foi liberado do time e o cargo foi removido.`
        );

    }

    // ==================================================
    // /AUTORELEASE
    // ==================================================

    if (nome === "autorelease") {

        const playerId = interaction.user.id;

        const { data: contract, error: contractError } =
            await supabase
                .from("contracts")
                .select("*")
                .eq("guild_id", interaction.guildId)
                .eq("player_id", playerId)
                .eq("status", "accepted")
                .limit(1)
                .maybeSingle();

        if (contractError) {
            console.error("❌ Erro no /autorelease:", contractError);
            return erro(
                interaction,
                "❌ Não foi possível verificar seu time."
            );
        }

        if (!contract) {
            return erro(
                interaction,
                "❌ Você não possui um contrato ativo com nenhum time."
            );
        }

        const removido = await removerCargoTime({
            guild: interaction.guild,
            playerId: playerId,
            roleId: contract.team_role_id
        });

        if (!removido) {
            return erro(
                interaction,
                "❌ Não foi possível remover seu cargo do time."
            );
        }

        const { data: team } = await supabase
            .from("teams")
            .select("name")
            .eq("guild_id", interaction.guildId)
            .eq("role_id", contract.team_role_id)
            .maybeSingle();

        const { error: updateError } = await supabase
            .from("contracts")
            .update({ status: "released" })
            .eq("id", contract.id);

        if (updateError) {
            console.error("❌ Erro ao atualizar autorelease:", updateError);
            return erro(
                interaction,
                "❌ O cargo foi removido, mas não foi possível atualizar o contrato."
            );
        }

        return erro(
            interaction,
            `✅ Você saiu do time **${team?.name || "desconhecido"}** e seu cargo foi removido.`
        );

    }

    return false;

}

// ======================================================
// BOTÕES ACEITAR / RECUSAR
// ======================================================

async function processarBotaoContrato(interaction) {

    if (!interaction.isButton()) return false;

    const id = interaction.customId;

    if (
        !id.startsWith("contract_accept_") &&
        !id.startsWith("contract_decline_")
    ) {
        return false;
    }

    const accepted = id.startsWith("contract_accept_");

    const contractId = id.replace(
        accepted ? "contract_accept_" : "contract_decline_",
        ""
    );

    const { data: contract, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .maybeSingle();

    if (error || !contract) {
        console.error("❌ Erro ao buscar contrato:", error);
        return erro(interaction, "❌ Este contrato não foi encontrado.");
    }

    if (interaction.user.id !== contract.player_id) {
        return erro(
            interaction,
            "❌ Apenas o jogador que recebeu este contrato pode responder."
        );
    }

    if (contract.status !== "pending") {
        return erro(interaction, "❌ Este contrato já foi respondido.");
    }

    const newStatus = accepted ? "accepted" : "declined";

    const { error: updateError } = await supabase
        .from("contracts")
        .update({ status: newStatus })
        .eq("id", contractId);

    if (updateError) {
        console.error("❌ Erro ao atualizar contrato:", updateError);
        return erro(interaction, "❌ Não foi possível atualizar o contrato.");
    }

    const guild = await interaction.client.guilds
        .fetch(contract.guild_id)
        .catch(() => null);

    const manager = await interaction.client.users
        .fetch(contract.manager_id)
        .catch(() => null);

    const player = await interaction.client.users
        .fetch(contract.player_id)
        .catch(() => null);

    const teamRole = guild
        ? await guild.roles.fetch(contract.team_role_id).catch(() => null)
        : null;

    const { data: team } = await supabase
        .from("teams")
        .select("name, logo_url, role_id")
        .eq("guild_id", contract.guild_id)
        .eq("role_id", contract.team_role_id)
        .maybeSingle();

    if (newStatus === "accepted" && guild && teamRole) {

        const adicionou = await adicionarCargoTime({
            guild: guild,
            playerId: contract.player_id,
            roleId: contract.team_role_id
        });

        if (!adicionou) {
            console.error(
                "❌ Não foi possível adicionar o cargo do time ao jogador."
            );
        }

    }

    const container = criarContratoContainer({
        manager: manager || `<@${contract.manager_id}>`,
        player: player || `<@${contract.player_id}>`,
        teamName: team?.name || teamRole?.name || "Time não encontrado",
        position: contract.position,
        funcao: contract.function,
        contractId: contract.id,
        status: newStatus,
        logoUrl: team?.logo_url || null
    });

    await interaction.update({
        components: [container]
    });

    await registrarContrato({
        client: interaction.client,
        contract: contract,
        status: newStatus
    });

    return true;

}

// ======================================================
// /INFO - EDITAR JOGADOR (BOTÕES E MODAIS, SÓ STAFF)
// Dois formulários (o Discord só permite 5 campos por modal):
//   perfil -> classe, wage
//   stats  -> goals, assists, clean sheets, motm's
// ======================================================

async function processarInfo(interaction) {

    const ehBotao =
        interaction.isButton() &&
        interaction.customId.startsWith("info_edit_");

    const ehModal =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith("info_modal_");

    if (!ehBotao && !ehModal) return false;

    if (
        !interaction.memberPermissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        await erro(
            interaction,
            "❌ Apenas a staff pode editar jogadores."
        );
        return true;
    }

    const campo = (id, label, valor) =>
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId(id)
                .setLabel(label)
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setValue(String(valor ?? ""))
        );

    // ---------- botão: abre o formulário ----------

    if (ehBotao) {

        const resto = interaction.customId.replace("info_edit_", "");
        const tipo = resto.startsWith("stats_") ? "stats" : "perfil";
        const discordId = resto.replace(/^(perfil|stats)_/, "");

        const { data: player } = await supabase
            .from("players")
            .select("*")
            .eq("guild_id", interaction.guildId)
            .eq("discord_id", discordId)
            .maybeSingle();

        if (!player) {
            await erro(interaction, "❌ Jogador não encontrado.");
            return true;
        }

        const modal = new ModalBuilder()
            .setCustomId(`info_modal_${tipo}_${discordId}`);

        if (tipo === "perfil") {

            modal
                .setTitle("Editar perfil")
                .addComponents(
                    campo("classe", "Classe (D, C-, C, ... S+, X)", player.class),
                    campo("wage", "Wage (ex: 75K)", player.wage)
                );

        } else {

            modal
                .setTitle("Editar stats")
                .addComponents(
                    campo("goals", "Goals", player.goals || 0),
                    campo("assists", "Assists", player.assists || 0),
                    campo("cleansheets", "Clean sheets", player.cleansheets || 0),
                    campo("motms", "MOTM's", player.motms || 0)
                );

        }

        await interaction.showModal(modal);
        return true;

    }

    // ---------- modal: salva as alterações ----------

    const resto = interaction.customId.replace("info_modal_", "");
    const tipo = resto.startsWith("stats_") ? "stats" : "perfil";
    const discordId = resto.replace(/^(perfil|stats)_/, "");

    let alteracoes = {};

    if (tipo === "perfil") {

        const classe = interaction.fields
            .getTextInputValue("classe")
            .trim()
            .toUpperCase();

        const wage = interaction.fields.getTextInputValue("wage").trim();

        if (!CLASSES.includes(classe)) {
            await erro(
                interaction,
                "❌ Classe inválida. Use: " + CLASSES.join(", ")
            );
            return true;
        }

        if (!wage) {
            await erro(interaction, "❌ O wage não pode ficar vazio.");
            return true;
        }

        alteracoes = { class: classe, wage: wage };

    } else {

        const goals = interaction.fields.getTextInputValue("goals").trim();
        const assists = interaction.fields.getTextInputValue("assists").trim();
        const cleansheets = interaction.fields.getTextInputValue("cleansheets").trim();
        const motms = interaction.fields.getTextInputValue("motms").trim();

        if (![goals, assists, cleansheets, motms].every(v => /^\d+$/.test(v))) {
            await erro(
                interaction,
                "❌ Goals, Assists, Clean sheets e MOTM's precisam ser números inteiros."
            );
            return true;
        }

        alteracoes = {
            goals: Number(goals),
            assists: Number(assists),
            cleansheets: Number(cleansheets),
            motms: Number(motms)
        };

    }

    const { error } = await supabase
        .from("players")
        .update(alteracoes)
        .eq("guild_id", interaction.guildId)
        .eq("discord_id", discordId);

    if (error) {
        console.error("❌ Erro ao editar jogador:", error);
        await erro(
            interaction,
            "❌ Não foi possível salvar as alterações. A coluna `cleansheets` existe na tabela `players`?"
        );
        return true;
    }

    await erro(
        interaction,
        `✅ Jogador <@${discordId}> atualizado. Use /info de novo para ver as mudanças.`
    );

    return true;

}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    criarTimeCommand,
    excluirTimeCommand,
    permCommand,
    unpermCommand,
    permlistCommand,
    aprovarCommand,
    infoCommand,
    fixturesCommand,
    contractCommand,
    releaseCommand,
    autoreleaseCommand,
    executarComando,
    processarBotaoContrato,
    processarInfo
};
