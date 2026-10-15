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
    MessageFlags
} = require("discord.js");

const supabase = require("./supabase");

// ======================================================
// CONFIGURA\u00c7\u00d5ES
// ======================================================

const CONTRACT_CHANNEL_ID = "1552636518886019072";
const CONTRACT_LOG_CHANNEL_ID = "1552634532262584391";

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
    pending: "\u23f3 Aguardando resposta do jogador.",
    accepted: "\u2705 Contrato aceito pelo jogador.",
    declined: "\u274c Contrato recusado pelo jogador.",
    released: "\ud83d\udd13 Jogador liberado do time."
};

const STATUS_LOG = {
    accepted: "\u2705 ACEITO",
    declined: "\u274c RECUSADO",
    released: "\ud83d\udd13 LIBERADO"
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

// Texto do time com a logo \u00e0 direita (se existir)
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
        `**Posi\u00e7\u00e3o:** ${position}\n` +
        `**Fun\u00e7\u00e3o:** ${funcao}`
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

    texto(container, "## \ud83d\udcc4 CONTRATO OFICIAL");

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
                    .setEmoji("\u2705")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`contract_decline_${contractId}`)
                    .setLabel("Recusar")
                    .setEmoji("\u274c")
                    .setStyle(ButtonStyle.Danger)

            )
        );

    }

    texto(container, "-# PML \u2022 CONTRACT SYSTEM");

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
            console.error("\u274c Servidor do contrato n\u00e3o encontrado.");
            return;
        }

        const logChannel = await guild.channels
            .fetch(CONTRACT_LOG_CHANNEL_ID)
            .catch(() => null);

        if (!logChannel) {
            console.error(
                `\u274c Canal de logs n\u00e3o encontrado: ${CONTRACT_LOG_CHANNEL_ID}`
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

        const teamName = team?.name || "Time n\u00e3o encontrado";

        const container = new ContainerBuilder();

        texto(container, "## \ud83d\udccb RESULTADO DO CONTRATO");

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
            `**Status:** ${STATUS_LOG[status] || "\u2753 DESCONHECIDO"}`
        );

        separador(container);

        texto(container, "-# VTL - CONTRACT SYSTEM");

        await logChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        console.log(
            `\u2705 Resultado do contrato ${contract.id} enviado para os logs.`
        );

    } catch (error) {

        console.error(
            "\u274c Erro ao registrar resultado do contrato:",
            error
        );

    }

}

// ======================================================
// DEFINI\u00c7\u00c3O DOS COMANDOS
// ======================================================

const criarTimeCommand =
    new SlashCommandBuilder()
        .setName("criartime")
        .setDescription("Cadastra um novo time na VTL.")
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
            .setDescription("Cargo do time que ser\u00e1 exclu\u00eddo.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const permCommand =
    new SlashCommandBuilder()
        .setName("perm")
        .setDescription("D\u00e1 permiss\u00e3o de Manager para um usu\u00e1rio.")
        .addUserOption(o => o
            .setName("manager")
            .setDescription("Usu\u00e1rio que ser\u00e1 Manager.")
            .setRequired(true))
        .addRoleOption(o => o
            .setName("time")
            .setDescription("Cargo do time.")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const unpermCommand =
    new SlashCommandBuilder()
        .setName("unperm")
        .setDescription("Remove a permiss\u00e3o de Manager.")
        .addUserOption(o => o
            .setName("manager")
            .setDescription("Manager que perder\u00e1 a permiss\u00e3o.")
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
            .setDescription("Sal\u00e1rio. Ex: 75K")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const contractCommand =
    new SlashCommandBuilder()
        .setName("contract")
        .setDescription("Envia um contrato para um jogador.")
        .addUserOption(o => o
            .setName("player")
            .setDescription("Jogador que receber\u00e1 o contrato.")
            .setRequired(true))
        .addStringOption(o => o
            .setName("posicao")
            .setDescription("Posi\u00e7\u00e3o do jogador.")
            .setRequired(true)
            .addChoices(...POSITIONS.map(p => ({ name: p, value: p }))))
        .addStringOption(o => o
            .setName("funcao")
            .setDescription("Fun\u00e7\u00e3o do jogador.")
            .setRequired(true)
            .addChoices(...FUNCTIONS.map(f => ({ name: f, value: f }))));

const releaseCommand =
    new SlashCommandBuilder()
        .setName("release")
        .setDescription("Libera um jogador do seu time.")
        .addUserOption(o => o
            .setName("player")
            .setDescription("Jogador que ser\u00e1 liberado.")
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

        console.error("\u274c Erro ao remover cargo do jogador:", error);
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

        console.error("\u274c Erro ao adicionar cargo do time:", error);
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
        criartime: "\u274c Voc\u00ea precisa ser administrador para criar um time.",
        excluirtime: "\u274c Voc\u00ea precisa ser administrador para excluir um time.",
        perm: "\u274c Voc\u00ea precisa ser administrador.",
        unperm: "\u274c Voc\u00ea precisa ser administrador.",
        permlist: "\u274c Voc\u00ea precisa ser administrador.",
        aprovar: "\u274c Voc\u00ea precisa ser administrador."
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
                "\u274c Voc\u00ea precisa enviar uma imagem como logo."
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
                "\u274c O logo precisa ser uma imagem PNG, JPG, WEBP ou GIF."
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
            console.error("\u274c Erro ao verificar time:", buscaError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel verificar os times cadastrados."
            );
        }

        if (timeExistente) {
            return erro(
                interaction,
                `\u274c O cargo ${cargo} j\u00e1 est\u00e1 cadastrado como o time **${timeExistente.name}**.`
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
            console.error("\u274c Erro ao verificar nome:", nomeError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel verificar o nome do time."
            );
        }

        if (nomeExistente) {
            return erro(
                interaction,
                "\u274c J\u00e1 existe um time com esse nome neste servidor."
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
            console.error("\u274c Erro ao criar time:", insertError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel cadastrar o time no Supabase."
            );
        }

        const container = new ContainerBuilder();

        texto(
            container,
            "## \u26bd TIME CADASTRADO\n\n" +
            `**Nome:** ${time.name}\n` +
            `**Cargo:** ${cargo}\n` +
            `**Criado por:** ${interaction.user}\n` +
            `**ID:** \`${time.id}\``
        );

        separador(container);

        texto(container, "-# VTL - CONTRACT SYSTEM");

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
            console.error("\u274c Erro ao buscar time:", teamError);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel verificar o time.");
        }

        if (!team) {
            return erro(
                interaction,
                "\u274c Esse cargo n\u00e3o est\u00e1 cadastrado como um time da PML."
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
                "\u274c Erro ao buscar jogadores do time:",
                contractsError
            );
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel verificar os jogadores do time."
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
            console.error("\u274c Erro ao remover permiss\u00f5es:", permissionError);
        }

        const { error: deleteError } = await supabase
            .from("teams")
            .delete()
            .eq("id", team.id);

        if (deleteError) {
            console.error("\u274c Erro ao excluir time:", deleteError);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel excluir o time.");
        }

        return erro(
            interaction,
            `\u2705 O time **${team.name}** foi exclu\u00eddo da PML.\n` +
            `\ud83d\udc65 ${contracts?.length || 0} jogador(es) foram liberados e tiveram o cargo removido.`
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
            console.error("\u274c Erro ao verificar time:", teamError);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel verificar o time.");
        }

        if (!team) {
            return erro(
                interaction,
                "\u274c Esse cargo n\u00e3o est\u00e1 cadastrado como um time da PML.\n\n" +
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
            console.error("\u274c Erro no /perm:", error);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel salvar a permiss\u00e3o.");
        }

        return erro(
            interaction,
            `\u2705 ${manager} agora \u00e9 Manager do time **${team.name}**.`
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
            console.error("\u274c Erro no /unperm:", error);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel remover a permiss\u00e3o.");
        }

        return erro(
            interaction,
            `\u2705 A permiss\u00e3o de ${manager} foi removida.`
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
            console.error("\u274c Erro no /permlist:", error);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel carregar a lista.");
        }

        if (!data || data.length === 0) {
            return erro(
                interaction,
                "\ud83d\udccb Nenhum Manager possui permiss\u00e3o neste servidor."
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
                `\ud83d\udc64 **Manager:** ${manager ? manager : `<@${permission.manager_id}>`}\n` +
                `\u26bd **Time:** ${team?.name || role?.name || "Desconhecido"}\n\n`;

        }

        return erro(
            interaction,
            "## \ud83d\udccb MANAGERS AUTORIZADOS\n\n" +
            lista +
            "\n-# PML \u2022 CONTRACT SYSTEM"
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
                "\u274c Link inv\u00e1lido. Use: https://www.roblox.com/users/ID/profile"
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

            console.log("\u26a0\ufe0f N\u00e3o foi poss\u00edvel buscar o avatar do Roblox.");

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
            console.error("\u274c Erro no /aprovar:", error);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel aprovar o jogador.");
        }

        return interaction.reply({
            content:
                `\u2705 ${membro} aprovado como **${nick}** (classe **${classe}**, wage **${wage}**).`
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
            `\u274c Este comando s\u00f3 pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`
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
            console.error("\u274c Erro ao verificar permiss\u00e3o:", permissionError);
            return erro(
                interaction,
                "\u274c Erro ao verificar sua permiss\u00e3o de Manager."
            );
        }

        if (!permission) {
            return erro(interaction, "\u274c Voc\u00ea n\u00e3o possui permiss\u00e3o de Manager.");
        }

        const teamRole = interaction.guild.roles.cache.get(
            permission.team_role_id
        );

        if (!teamRole) {
            return erro(interaction, "\u274c O cargo do seu time n\u00e3o foi encontrado.");
        }

        const { data: team, error: teamError } =
            await supabase
                .from("teams")
                .select("id, name, logo_url, role_id")
                .eq("guild_id", interaction.guildId)
                .eq("role_id", teamRole.id)
                .maybeSingle();

        if (teamError) {
            console.error("\u274c Erro ao verificar time:", teamError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel verificar o cadastro do seu time."
            );
        }

        if (!team) {
            return erro(interaction, "\u274c Seu time n\u00e3o est\u00e1 cadastrado na VTL.");
        }

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
                "\u274c Erro ao verificar contrato existente:",
                existingError
            );
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel verificar os contratos do jogador."
            );
        }

        if (existingContract) {
            return erro(
                interaction,
                "\u274c Esse jogador j\u00e1 possui um contrato ativo."
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
            console.error("\u274c Erro ao criar contrato:", contractError);
            return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel criar o contrato.");
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
                `\u26a0\ufe0f N\u00e3o foi poss\u00edvel enviar DM para ${player.tag}.`
            );

            const fallbackChannel = await interaction.guild.channels
                .fetch(CONTRACT_LOG_CHANNEL_ID)
                .catch(() => null);

            if (fallbackChannel) {

                await fallbackChannel
                    .send({
                        content:
                            `\u26a0\ufe0f N\u00e3o foi poss\u00edvel enviar o contrato por DM para ${player}.`
                    })
                    .catch(() => {});

            }

        }

        return erro(interaction, `\u2705 Contrato enviado para ${player}.`);

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
            return erro(interaction, "\u274c Erro ao verificar sua permiss\u00e3o.");
        }

        if (!permission) {
            return erro(interaction, "\u274c Voc\u00ea n\u00e3o possui permiss\u00e3o de Manager.");
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
            console.error("\u274c Erro ao buscar contrato:", contractError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel encontrar o contrato."
            );
        }

        if (!contract) {
            return erro(
                interaction,
                "\u274c Esse jogador n\u00e3o possui contrato com seu time."
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
                "\u274c N\u00e3o foi poss\u00edvel remover o cargo do jogador."
            );
        }

        const { error: releaseError } = await supabase
            .from("contracts")
            .update({ status: "released" })
            .eq("id", contract.id);

        if (releaseError) {
            console.error("\u274c Erro ao liberar jogador:", releaseError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel atualizar o contrato."
            );
        }

        return erro(
            interaction,
            `\u2705 ${player} foi liberado do time e o cargo foi removido.`
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
            console.error("\u274c Erro no /autorelease:", contractError);
            return erro(
                interaction,
                "\u274c N\u00e3o foi poss\u00edvel verificar seu time."
            );
        }

        if (!contract) {
            return erro(
                interaction,
                "\u274c Voc\u00ea n\u00e3o possui um contrato ativo com nenhum time."
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
                "\u274c N\u00e3o foi poss\u00edvel remover seu cargo do time."
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
            console.error("\u274c Erro ao atualizar autorelease:", updateError);
            return erro(
                interaction,
                "\u274c O cargo foi removido, mas n\u00e3o foi poss\u00edvel atualizar o contrato."
            );
        }

        return erro(
            interaction,
            `\u2705 Voc\u00ea saiu do time **${team?.name || "desconhecido"}** e seu cargo foi removido.`
        );

    }

    return false;

}

// ======================================================
// BOT\u00d5ES ACEITAR / RECUSAR
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
        console.error("\u274c Erro ao buscar contrato:", error);
        return erro(interaction, "\u274c Este contrato n\u00e3o foi encontrado.");
    }

    if (interaction.user.id !== contract.player_id) {
        return erro(
            interaction,
            "\u274c Apenas o jogador que recebeu este contrato pode responder."
        );
    }

    if (contract.status !== "pending") {
        return erro(interaction, "\u274c Este contrato j\u00e1 foi respondido.");
    }

    const newStatus = accepted ? "accepted" : "declined";

    const { error: updateError } = await supabase
        .from("contracts")
        .update({ status: newStatus })
        .eq("id", contractId);

    if (updateError) {
        console.error("\u274c Erro ao atualizar contrato:", updateError);
        return erro(interaction, "\u274c N\u00e3o foi poss\u00edvel atualizar o contrato.");
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
                "\u274c N\u00e3o foi poss\u00edvel adicionar o cargo do time ao jogador."
            );
        }

    }

    const container = criarContratoContainer({
        manager: manager || `<@${contract.manager_id}>`,
        player: player || `<@${contract.player_id}>`,
        teamName: team?.name || teamRole?.name || "Time n\u00e3o encontrado",
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
// EXPORTS
// ======================================================

module.exports = {
    criarTimeCommand,
    excluirTimeCommand,
    permCommand,
    unpermCommand,
    permlistCommand,
    aprovarCommand,
    contractCommand,
    releaseCommand,
    autoreleaseCommand,
    executarComando,
    processarBotaoContrato
};
