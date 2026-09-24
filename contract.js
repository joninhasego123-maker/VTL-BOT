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
// CONFIGURAÇÕES
// ======================================================

const CONTRACT_CHANNEL_ID =
    "1552636518886019072";

const CONTRACT_LOG_CHANNEL_ID =
    "1552634532262584391";

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

// ======================================================
// VERIFICAR CANAL
// ======================================================

function verificarCanal(interaction) {

    return (
        interaction.channelId ===
        CONTRACT_CHANNEL_ID
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

    let statusText =
        "⏳ Aguardando resposta do jogador.";

    if (status === "accepted") {

        statusText =
            "✅ Contrato aceito pelo jogador.";

    }

    if (status === "declined") {

        statusText =
            "❌ Contrato recusado pelo jogador.";

    }

    if (status === "released") {

        statusText =
            "🔓 Jogador liberado do time.";

    }

    const container =
        new ContainerBuilder();

    // ==================================================
    // TÍTULO
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "## 📄 CONTRATO OFICIAL"
            )
    );

    // ==================================================
    // MANAGER
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                `**Manager:** ${manager}\n` +
                `**Manager ID:** \`${manager.id}\``
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // JOGADOR
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                `**Jogador:** ${player}\n` +
                `**Player ID:** \`${player.id}\``
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // TIME / POSIÇÃO / FUNÇÃO + LOGO À DIREITA
    // ==================================================

    if (logoUrl) {

        const teamSection =
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `**Time:** ${teamName}\n` +
                            `**Posição:** ${position}\n` +
                            `**Função:** ${funcao}`
                        )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(logoUrl)
                );

        container.addSectionComponents(
            teamSection
        );

    } else {

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `**Time:** ${teamName}\n` +
                    `**Posição:** ${position}\n` +
                    `**Função:** ${funcao}`
                )
        );

    }

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // STATUS
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                `**Status:** ${statusText}`
            )
    );

    // ==================================================
    // BOTÕES
    // ==================================================

    if (status === "pending") {

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            `contract_accept_${contractId}`
                        )
                        .setLabel("Aceitar")
                        .setEmoji("✅")
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `contract_decline_${contractId}`
                        )
                        .setLabel("Recusar")
                        .setEmoji("❌")
                        .setStyle(
                            ButtonStyle.Danger
                        )

                );

        container.addActionRowComponents(
            row
        );

    }

    // ==================================================
    // FOOTER
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "-# VTL - CONTRACT SYSTEM"
            )
    );

    return container;

}

// ======================================================
// REGISTRAR LOG
// ======================================================

async function registrarContrato({
    client,
    contract,
    status
}) {

    try {

        const guild =
            await client.guilds.fetch(
                contract.guild_id
            ).catch(() => null);

        if (!guild) {
            console.error(
                "❌ Servidor do contrato não encontrado."
            );
            return;
        }

        const logChannel =
            await guild.channels.fetch(
                CONTRACT_LOG_CHANNEL_ID
            ).catch(() => null);

        if (!logChannel) {

            console.error(
                `❌ Canal de logs não encontrado: ${CONTRACT_LOG_CHANNEL_ID}`
            );

            return;
        }

        const manager =
            await client.users.fetch(
                contract.manager_id
            ).catch(() => null);

        const player =
            await client.users.fetch(
                contract.player_id
            ).catch(() => null);

        const {
            data: team
        } = await supabase
            .from("teams")
            .select(
                "name, logo_url, role_id"
            )
            .eq(
                "guild_id",
                contract.guild_id
            )
            .eq(
                "role_id",
                contract.team_role_id
            )
            .maybeSingle();

        let statusText =
            "❓ DESCONHECIDO";

        if (status === "accepted") {
            statusText = "✅ ACEITO";
        }

        if (status === "declined") {
            statusText = "❌ RECUSADO";
        }

        if (status === "released") {
            statusText = "🔓 LIBERADO";
        }

        const teamName =
            team?.name ||
            "Time não encontrado";

        const container =
            new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "## 📋 RESULTADO DO CONTRATO"
                )
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `**Manager:** ${
                        manager ||
                        `<@${contract.manager_id}>`
                    }\n` +
                    `**Manager ID:** \`${contract.manager_id}\``
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `**Jogador:** ${
                        player ||
                        `<@${contract.player_id}>`
                    }\n` +
                    `**Player ID:** \`${contract.player_id}\``
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        // ==================================================
        // TIME + LOGO
        // ==================================================

        if (team?.logo_url) {

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `**Time:** ${teamName}\n` +
                                `**Posição:** ${contract.position}\n` +
                                `**Função:** ${contract.function}`
                            )
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                            .setURL(team.logo_url)
                    )
            );

        } else {

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `**Time:** ${teamName}\n` +
                        `**Posição:** ${contract.position}\n` +
                        `**Função:** ${contract.function}`
                    )
            );

        }

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `**Status:** ${statusText}`
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "-# VTL - CONTRACT SYSTEM"
                )
        );

        await logChannel.send({
            components: [
                container
            ],
            flags:
                MessageFlags.IsComponentsV2
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
// /CRIARTIME
// ======================================================

const criarTimeCommand =
    new SlashCommandBuilder()
        .setName("criartime")
        .setDescription(
            "Cadastra um novo time na VTL."
        )
        .addStringOption(option =>
            option
                .setName("nome")
                .setDescription(
                    "Nome do time."
                )
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName("logo")
                .setDescription(
                    "Imagem do logo do time."
                )
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("cargo")
                .setDescription(
                    "Cargo que representa o time."
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        );

// ======================================================
// /EXCLUIRTIME
// ======================================================

const excluirTimeCommand =
    new SlashCommandBuilder()
        .setName("excluirtime")
        .setDescription(
            "Exclui um time cadastrado na VTL."
        )
        .addRoleOption(option =>
            option
                .setName("cargo")
                .setDescription(
                    "Cargo do time que será excluído."
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        );

// ======================================================
// /PERM
// ======================================================

const permCommand =
    new SlashCommandBuilder()
        .setName("perm")
        .setDescription(
            "Dá permissão de Manager para um usuário."
        )
        .addUserOption(option =>
            option
                .setName("manager")
                .setDescription(
                    "Usuário que será Manager."
                )
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("time")
                .setDescription(
                    "Cargo do time."
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        );

// ======================================================
// /UNPERM
// ======================================================

const unpermCommand =
    new SlashCommandBuilder()
        .setName("unperm")
        .setDescription(
            "Remove a permissão de Manager."
        )
        .addUserOption(option =>
            option
                .setName("manager")
                .setDescription(
                    "Manager que perderá a permissão."
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        );

// ======================================================
// /PERMLIST
// ======================================================

const permlistCommand =
    new SlashCommandBuilder()
        .setName("permlist")
        .setDescription(
            "Lista os Managers autorizados."
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        );

// ======================================================
// /CONTRACT
// ======================================================

const contractCommand =
    new SlashCommandBuilder()
        .setName("contract")
        .setDescription(
            "Envia um contrato para um jogador."
        )
        .addUserOption(option =>
            option
                .setName("player")
                .setDescription(
                    "Jogador que receberá o contrato."
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("posicao")
                .setDescription(
                    "Posição do jogador."
                )
                .setRequired(true)
                .addChoices(
                    ...POSITIONS.map(
                        position => ({
                            name: position,
                            value: position
                        })
                    )
                )
        )
        .addStringOption(option =>
            option
                .setName("funcao")
                .setDescription(
                    "Função do jogador."
                )
                .setRequired(true)
                .addChoices(
                    ...FUNCTIONS.map(
                        funcao => ({
                            name: funcao,
                            value: funcao
                        })
                    )
                )
        );

// ======================================================
// /RELEASE
// ======================================================

const releaseCommand =
    new SlashCommandBuilder()
        .setName("release")
        .setDescription(
            "Libera um jogador do seu time."
        )
        .addUserOption(option =>
            option
                .setName("player")
                .setDescription(
                    "Jogador que será liberado."
                )
                .setRequired(true)
        );

// ======================================================
// /AUTORELEASE
// ======================================================

const autoreleaseCommand =
    new SlashCommandBuilder()
        .setName("autorelease")
        .setDescription(
            "Sai automaticamente do seu time."
        );

// ======================================================
// FUNÇÃO PARA REMOVER CARGO
// ======================================================

async function removerCargoTime({
    guild,
    playerId,
    roleId
}) {

    try {

        const member =
            await guild.members.fetch(
                playerId
            ).catch(() => null);

        if (!member) {
            return false;
        }

        if (
            member.roles.cache.has(
                roleId
            )
        ) {

            await member.roles.remove(
                roleId
            );

        }

        return true;

    } catch (error) {

        console.error(
            "❌ Erro ao remover cargo do jogador:",
            error
        );

        return false;
    }
}

// ======================================================
// FUNÇÃO PARA ADICIONAR CARGO
// ======================================================

async function adicionarCargoTime({
    guild,
    playerId,
    roleId
}) {

    try {

        const member =
            await guild.members.fetch(
                playerId
            ).catch(() => null);

        if (!member) {
            return false;
        }

        if (
            !member.roles.cache.has(
                roleId
            )
        ) {

            await member.roles.add(
                roleId
            );

        }

        return true;

    } catch (error) {

        console.error(
            "❌ Erro ao adicionar cargo do time:",
            error
        );

        return false;
    }
}

// ======================================================
// EXECUTAR COMANDOS
// ======================================================

async function executarComando(interaction) {

    // ==================================================
    // /CRIARTIME
    // ==================================================

    if (
        interaction.commandName ===
        "criartime"
    ) {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador para criar um time.",
                ephemeral: true
            });

        }

        const nome =
            interaction.options
                .getString("nome")
                .trim();

        const logo =
            interaction.options
                .getAttachment("logo");

        const cargo =
            interaction.options
                .getRole("cargo");

        if (!logo) {

            return interaction.reply({
                content:
                    "❌ Você precisa enviar uma imagem como logo.",
                ephemeral: true
            });

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
            !tiposPermitidos.includes(
                logo.contentType
            )
        ) {

            return interaction.reply({
                content:
                    "❌ O logo precisa ser uma imagem PNG, JPG, WEBP ou GIF.",
                ephemeral: true
            });

        }

        const {
            data: timeExistente,
            error: buscaError
        } = await supabase
            .from("teams")
            .select("id, name")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "role_id",
                cargo.id
            )
            .maybeSingle();

        if (buscaError) {

            console.error(
                "❌ Erro ao verificar time:",
                buscaError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar os times cadastrados.",
                ephemeral: true
            });

        }

        if (timeExistente) {

            return interaction.reply({
                content:
                    `❌ O cargo ${cargo} já está cadastrado como o time **${timeExistente.name}**.`,
                ephemeral: true
            });

        }

        const {
            data: nomeExistente,
            error: nomeError
        } = await supabase
            .from("teams")
            .select("id")
            .ilike(
                "name",
                nome
            )
            .eq(
                "guild_id",
                interaction.guildId
            )
            .maybeSingle();

        if (nomeError) {

            console.error(
                "❌ Erro ao verificar nome:",
                nomeError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar o nome do time.",
                ephemeral: true
            });

        }

        if (nomeExistente) {

            return interaction.reply({
                content:
                    "❌ Já existe um time com esse nome neste servidor.",
                ephemeral: true
            });

        }

        const {
            data: time,
            error: insertError
        } = await supabase
            .from("teams")
            .insert({
                guild_id:
                    interaction.guildId,

                name:
                    nome,

                logo_url:
                    logo.url,

                role_id:
                    cargo.id,

                created_by:
                    interaction.user.id
            })
            .select()
            .single();

        if (insertError) {

            console.error(
                "❌ Erro ao criar time:",
                insertError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível cadastrar o time no Supabase.",
                ephemeral: true
            });

        }

        const container =
            new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "## ⚽ TIME CADASTRADO\n\n" +
                    `**Nome:** ${time.name}\n` +
                    `**Cargo:** ${cargo}\n` +
                    `**Criado por:** ${interaction.user}\n` +
                    `**ID:** \`${time.id}\``
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "-# VTL - CONTRACT SYSTEM"
                )
        );

        return interaction.reply({
            components: [
                container
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

    }

    // ==================================================
    // /EXCLUIRTIME
    // ==================================================

    if (
        interaction.commandName ===
        "excluirtime"
    ) {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador para excluir um time.",
                ephemeral: true
            });

        }

        const cargo =
            interaction.options.getRole(
                "cargo"
            );

        const {
            data: team,
            error: teamError
        } = await supabase
            .from("teams")
            .select("*")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "role_id",
                cargo.id
            )
            .maybeSingle();

        if (teamError) {

            console.error(
                "❌ Erro ao buscar time:",
                teamError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar o time.",
                ephemeral: true
            });

        }

        if (!team) {

            return interaction.reply({
                content:
                    "❌ Esse cargo não está cadastrado como um time da VTL.",
                ephemeral: true
            });

        }

        // ==============================================
        // BUSCAR JOGADORES ATIVOS
        // ==============================================

        const {
            data: contracts,
            error: contractsError
        } = await supabase
            .from("contracts")
            .select(
                "id, player_id"
            )
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "team_role_id",
                cargo.id
            )
            .eq(
                "status",
                "accepted"
            );

        if (contractsError) {

            console.error(
                "❌ Erro ao buscar jogadores do time:",
                contractsError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar os jogadores do time.",
                ephemeral: true
            });

        }

        // ==============================================
        // REMOVER CARGO DOS JOGADORES
        // ==============================================

        for (
            const contract
            of contracts || []
        ) {

            await removerCargoTime({
                guild:
                    interaction.guild,

                playerId:
                    contract.player_id,

                roleId:
                    cargo.id
            });

            await supabase
                .from("contracts")
                .update({
                    status:
                        "released"
                })
                .eq(
                    "id",
                    contract.id
                );

        }

        // ==============================================
        // REMOVER PERMISSÕES DOS MANAGERS
        // ==============================================

        const {
            error: permissionError
        } = await supabase
            .from("manager_permissions")
            .delete()
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "team_role_id",
                cargo.id
            );

        if (permissionError) {

            console.error(
                "❌ Erro ao remover permissões:",
                permissionError
            );

        }

        // ==============================================
        // EXCLUIR TIME
        // ==============================================

        const {
            error: deleteError
        } = await supabase
            .from("teams")
            .delete()
            .eq(
                "id",
                team.id
            );

        if (deleteError) {

            console.error(
                "❌ Erro ao excluir time:",
                deleteError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível excluir o time.",
                ephemeral: true
            });

        }

        return interaction.reply({
            content:
                `✅ O time **${team.name}** foi excluído da VTL.\n` +
                `👥 ${contracts?.length || 0} jogador(es) foram liberados e tiveram o cargo removido.`,
            ephemeral: true
        });

    }

    // ==================================================
    // /PERM
    // ==================================================

    if (
        interaction.commandName ===
        "perm"
    ) {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador.",
                ephemeral: true
            });

        }

        const manager =
            interaction.options.getUser(
                "manager"
            );

        const teamRole =
            interaction.options.getRole(
                "time"
            );

        const {
            data: team,
            error: teamError
        } = await supabase
            .from("teams")
            .select("*")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "role_id",
                teamRole.id
            )
            .maybeSingle();

        if (teamError) {

            console.error(
                "❌ Erro ao verificar time:",
                teamError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar o time.",
                ephemeral: true
            });

        }

        if (!team) {

            return interaction.reply({
                content:
                    "❌ Esse cargo não está cadastrado como um time da VTL.\n\n" +
                    "Cadastre primeiro usando `/criartime`.",
                ephemeral: true
            });

        }

        const {
            error
        } = await supabase
            .from("manager_permissions")
            .upsert(
                {
                    guild_id:
                        interaction.guildId,

                    manager_id:
                        manager.id,

                    team_role_id:
                        teamRole.id
                },
                {
                    onConflict:
                        "guild_id,manager_id"
                }
            );

        if (error) {

            console.error(
                "❌ Erro no /perm:",
                error
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível salvar a permissão.",
                ephemeral: true
            });

        }

        return interaction.reply({
            content:
                `✅ ${manager} agora é Manager do time **${team.name}**.`,
            ephemeral: true
        });

    }

    // ==================================================
    // /UNPERM
    // ==================================================

    if (
        interaction.commandName ===
        "unperm"
    ) {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador.",
                ephemeral: true
            });

        }

        const manager =
            interaction.options.getUser(
                "manager"
            );

        const {
            error
        } = await supabase
            .from("manager_permissions")
            .delete()
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "manager_id",
                manager.id
            );

        if (error) {

            console.error(
                "❌ Erro no /unperm:",
                error
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível remover a permissão.",
                ephemeral: true
            });

        }

        return interaction.reply({
            content:
                `✅ A permissão de ${manager} foi removida.`,
            ephemeral: true
        });

    }

    // ==================================================
    // /PERMLIST
    // ==================================================

    if (
        interaction.commandName ===
        "permlist"
    ) {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador.",
                ephemeral: true
            });

        }

        const {
            data,
            error
        } = await supabase
            .from("manager_permissions")
            .select(
                "manager_id, team_role_id"
            )
            .eq(
                "guild_id",
                interaction.guildId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                "❌ Erro no /permlist:",
                error
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível carregar a lista.",
                ephemeral: true
            });

        }

        if (
            !data ||
            data.length === 0
        ) {

            return interaction.reply({
                content:
                    "📋 Nenhum Manager possui permissão neste servidor.",
                ephemeral: true
            });

        }

        let lista = "";

        for (
            const permission
            of data
        ) {

            const manager =
                await interaction.client.users
                    .fetch(
                        permission.manager_id
                    )
                    .catch(() => null);

            const role =
                interaction.guild.roles.cache.get(
                    permission.team_role_id
                );

            const {
                data: team
            } = await supabase
                .from("teams")
                .select("name")
                .eq(
                    "guild_id",
                    interaction.guildId
                )
                .eq(
                    "role_id",
                    permission.team_role_id
                )
                .maybeSingle();

            lista +=
                `👤 **Manager:** ${
                    manager
                        ? manager
                        : `<@${permission.manager_id}>`
                }\n` +

                `⚽ **Time:** ${
                    team?.name ||
                    role?.name ||
                    "Desconhecido"
                }\n\n`;

        }

        return interaction.reply({
            content:
                "## 📋 MANAGERS AUTORIZADOS\n\n" +
                lista +
                "\n-# VTL - CONTRACT SYSTEM",
            ephemeral: true
        });

    }

    // ==================================================
    // VERIFICAR CANAL
    // ==================================================

    if (
        interaction.commandName === "contract" ||
        interaction.commandName === "release" ||
        interaction.commandName === "autorelease"
    ) {

        if (
            !verificarCanal(
                interaction
            )
        ) {

            return interaction.reply({
                content:
                    `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`,
                ephemeral: true
            });

        }

    }

    // ==================================================
    // /CONTRACT
    // ==================================================

    if (
        interaction.commandName ===
        "contract"
    ) {

        const managerId =
            interaction.user.id;

        const player =
            interaction.options.getUser(
                "player"
            );

        const position =
            interaction.options.getString(
                "posicao"
            );

        const funcao =
            interaction.options.getString(
                "funcao"
            );

        const {
            data: permission,
            error: permissionError
        } = await supabase
            .from("manager_permissions")
            .select(
                "manager_id, team_role_id"
            )
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "manager_id",
                managerId
            )
            .maybeSingle();

        if (permissionError) {

            console.error(
                "❌ Erro ao verificar permissão:",
                permissionError
            );

            return interaction.reply({
                content:
                    "❌ Erro ao verificar sua permissão de Manager.",
                ephemeral: true
            });

        }

        if (!permission) {

            return interaction.reply({
                content:
                    "❌ Você não possui permissão de Manager.",
                ephemeral: true
            });

        }

        const teamRole =
            interaction.guild.roles.cache.get(
                permission.team_role_id
            );

        if (!teamRole) {

            return interaction.reply({
                content:
                    "❌ O cargo do seu time não foi encontrado.",
                ephemeral: true
            });

        }

        const {
            data: team,
            error: teamError
        } = await supabase
            .from("teams")
            .select(
                "id, name, logo_url, role_id"
            )
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "role_id",
                teamRole.id
            )
            .maybeSingle();

        if (teamError) {

            console.error(
                "❌ Erro ao verificar time:",
                teamError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar o cadastro do seu time.",
                ephemeral: true
            });

        }

        if (!team) {

            return interaction.reply({
                content:
                    "❌ Seu time não está cadastrado na VTL.",
                ephemeral: true
            });

        }

        // ==============================================
        // VERIFICAR CONTRATO ATIVO
        // ==============================================

        const {
            data: existingContract,
            error: existingError
        } = await supabase
            .from("contracts")
            .select("*")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "player_id",
                player.id
            )
            .eq(
                "status",
                "accepted"
            )
            .limit(1)
            .maybeSingle();

        if (existingError) {

            console.error(
                "❌ Erro ao verificar contrato existente:",
                existingError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar os contratos do jogador.",
                ephemeral: true
            });

        }

        if (existingContract) {

            return interaction.reply({
                content:
                    "❌ Esse jogador já possui um contrato ativo.",
                ephemeral: true
            });

        }

        // ==============================================
        // CRIAR CONTRATO
        // ==============================================

        const {
            data: contract,
            error: contractError
        } = await supabase
            .from("contracts")
            .insert({
                guild_id:
                    interaction.guildId,

                manager_id:
                    managerId,

                manager_role_id:
                    teamRole.id,

                player_id:
                    player.id,

                team_role_id:
                    teamRole.id,

                position:
                    position,

                function:
                    funcao,

                status:
                    "pending"
            })
            .select()
            .single();

        if (contractError) {

            console.error(
                "❌ Erro ao criar contrato:",
                contractError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível criar o contrato.",
                ephemeral: true
            });

        }

        // ==============================================
        // CONTRATO NO CANAL
        // ==============================================

        const container =
            criarContratoContainer({

                manager:
                    interaction.user,

                player:
                    player,

                teamName:
                    team.name,

                position:
                    position,

                funcao:
                    funcao,

                contractId:
                    contract.id,

                status:
                    "pending",

                logoUrl:
                    team.logo_url

            });

        const contractMessage =
            await interaction.channel.send({

                components: [
                    container
                ],

                flags:
                    MessageFlags.IsComponentsV2

            });

        await supabase
            .from("contracts")
            .update({

                message_id:
                    contractMessage.id,

                channel_id:
                    interaction.channelId

            })
            .eq(
                "id",
                contract.id
            );

        // ==============================================
        // DM
        // ==============================================

        try {

            const dm =
                await player.createDM();

            const dmContainer =
                criarContratoContainer({

                    manager:
                        interaction.user,

                    player:
                        player,

                    teamName:
                        team.name,

                    position:
                        position,

                    funcao:
                        funcao,

                    contractId:
                        contract.id,

                    status:
                        "pending",

                    logoUrl:
                        team.logo_url

                });

            await dm.send({

                components: [
                    dmContainer
                ],

                flags:
                    MessageFlags.IsComponentsV2

            });

        } catch (error) {

            console.log(
                `⚠️ Não foi possível enviar DM para ${player.tag}.`
            );

            const fallbackChannel =
                await interaction.guild.channels.fetch(
                    CONTRACT_LOG_CHANNEL_ID
                ).catch(() => null);

            if (fallbackChannel) {

                await fallbackChannel.send({
                    content:
                        `⚠️ Não foi possível enviar o contrato por DM para ${player}.`
                }).catch(() => {});

            }

        }

        return interaction.reply({

            content:
                `✅ Contrato enviado para ${player}.`,

            ephemeral: true

        });

    }

    // ==================================================
    // /RELEASE
    // ==================================================

    if (
        interaction.commandName ===
        "release"
    ) {

        const managerId =
            interaction.user.id;

        const player =
            interaction.options.getUser(
                "player"
            );

        const {
            data: permission,
            error: permissionError
        } = await supabase
            .from("manager_permissions")
            .select(
                "team_role_id"
            )
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "manager_id",
                managerId
            )
            .maybeSingle();

        if (permissionError) {

            return interaction.reply({
                content:
                    "❌ Erro ao verificar sua permissão.",
                ephemeral: true
            });

        }

        if (!permission) {

            return interaction.reply({
                content:
                    "❌ Você não possui permissão de Manager.",
                ephemeral: true
            });

        }

        const {
            data: contract,
            error: contractError
        } = await supabase
            .from("contracts")
            .select("*")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "player_id",
                player.id
            )
            .eq(
                "team_role_id",
                permission.team_role_id
            )
            .eq(
                "status",
                "accepted"
            )
            .limit(1)
            .maybeSingle();

        if (contractError) {

            console.error(
                "❌ Erro ao buscar contrato:",
                contractError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível encontrar o contrato.",
                ephemeral: true
            });

        }

        if (!contract) {

            return interaction.reply({
                content:
                    "❌ Esse jogador não possui contrato com seu time.",
                ephemeral: true
            });

        }

        // ==============================================
        // REMOVER CARGO
        // ==============================================

        const removido =
            await removerCargoTime({

                guild:
                    interaction.guild,

                playerId:
                    player.id,

                roleId:
                    permission.team_role_id

            });

        if (!removido) {

            return interaction.reply({
                content:
                    "❌ Não foi possível remover o cargo do jogador.",
                ephemeral: true
            });

        }

        // ==============================================
        // ATUALIZAR CONTRATO
        // ==============================================

        const {
            error: releaseError
        } = await supabase
            .from("contracts")
            .update({
                status:
                    "released"
            })
            .eq(
                "id",
                contract.id
            );

        if (releaseError) {

            console.error(
                "❌ Erro ao liberar jogador:",
                releaseError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível atualizar o contrato.",
                ephemeral: true
            });

        }

        return interaction.reply({

            content:
                `✅ ${player} foi liberado do time e o cargo foi removido.`,

            ephemeral: true

        });

    }

    // ==================================================
    // /AUTORELEASE
    // ==================================================

    if (
        interaction.commandName ===
        "autorelease"
    ) {

        const playerId =
            interaction.user.id;

        const {
            data: contract,
            error: contractError
        } = await supabase
            .from("contracts")
            .select("*")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "player_id",
                playerId
            )
            .eq(
                "status",
                "accepted"
            )
            .limit(1)
            .maybeSingle();

        if (contractError) {

            console.error(
                "❌ Erro no /autorelease:",
                contractError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar seu time.",
                ephemeral: true
            });

        }

        if (!contract) {

            return interaction.reply({
                content:
                    "❌ Você não possui um contrato ativo com nenhum time.",
                ephemeral: true
            });

        }

        const removido =
            await removerCargoTime({

                guild:
                    interaction.guild,

                playerId:
                    playerId,

                roleId:
                    contract.team_role_id

            });

        if (!removido) {

            return interaction.reply({
                content:
                    "❌ Não foi possível remover seu cargo do time.",
                ephemeral: true
            });

        }

        const {
            data: team
        } = await supabase
            .from("teams")
            .select("name")
            .eq(
                "guild_id",
                interaction.guildId
            )
            .eq(
                "role_id",
                contract.team_role_id
            )
            .maybeSingle();

        const {
            error: updateError
        } = await supabase
            .from("contracts")
            .update({
                status:
                    "released"
            })
            .eq(
                "id",
                contract.id
            );

        if (updateError) {

            console.error(
                "❌ Erro ao atualizar autorelease:",
                updateError
            );

            return interaction.reply({
                content:
                    "❌ O cargo foi removido, mas não foi possível atualizar o contrato.",
                ephemeral: true
            });

        }

        return interaction.reply({

            content:
                `✅ Você saiu do time **${
                    team?.name || "desconhecido"
                }** e seu cargo foi removido.`,

            ephemeral: true

        });

    }

    return false;

}

// ======================================================
// PROCESSAR BOTÕES
// ======================================================

async function processarBotaoContrato(
    interaction
) {

    if (
        !interaction.isButton()
    ) {
        return false;
    }

    if (
        !interaction.customId.startsWith(
            "contract_accept_"
        ) &&
        !interaction.customId.startsWith(
            "contract_decline_"
        )
    ) {
        return false;
    }

    const accepted =
        interaction.customId.startsWith(
            "contract_accept_"
        );

    const contractId =
        interaction.customId.replace(
            accepted
                ? "contract_accept_"
                : "contract_decline_",
            ""
        );

    // ==============================================
    // BUSCAR CONTRATO
    // ==============================================

    const {
        data: contract,
        error
    } = await supabase
        .from("contracts")
        .select("*")
        .eq(
            "id",
            contractId
        )
        .maybeSingle();

    if (error || !contract) {

        console.error(
            "❌ Erro ao buscar contrato:",
            error
        );

        return interaction.reply({
            content:
                "❌ Este contrato não foi encontrado.",
            ephemeral: true
        });

    }

    // ==============================================
    // VERIFICAR JOGADOR
    // ==============================================

    if (
        interaction.user.id !==
        contract.player_id
    ) {

        return interaction.reply({
            content:
                "❌ Apenas o jogador que recebeu este contrato pode responder.",
            ephemeral: true
        });

    }

    // ==============================================
    // VERIFICAR STATUS
    // ==============================================

    if (
        contract.status !==
        "pending"
    ) {

        return interaction.reply({
            content:
                "❌ Este contrato já foi respondido.",
            ephemeral: true
        });

    }

    const newStatus =
        accepted
            ? "accepted"
            : "declined";

    // ==============================================
    // ATUALIZAR SUPABASE
    // ==============================================

    const {
        error: updateError
    } = await supabase
        .from("contracts")
        .update({
            status:
                newStatus
        })
        .eq(
            "id",
            contractId
        );

    if (updateError) {

        console.error(
            "❌ Erro ao atualizar contrato:",
            updateError
        );

        return interaction.reply({
            content:
                "❌ Não foi possível atualizar o contrato.",
            ephemeral: true
        });

    }

    // ==============================================
    // BUSCAR SERVIDOR
    // ==============================================

    const guild =
        await interaction.client.guilds.fetch(
            contract.guild_id
        ).catch(() => null);

    // ==============================================
    // BUSCAR USUÁRIOS
    // ==============================================

    const manager =
        await interaction.client.users
            .fetch(
                contract.manager_id
            )
            .catch(() => null);

    const player =
        await interaction.client.users
            .fetch(
                contract.player_id
            )
            .catch(() => null);

    // ==============================================
    // BUSCAR TIME
    // ==============================================

    const teamRole =
        guild
            ? await guild.roles.fetch(
                contract.team_role_id
            ).catch(() => null)
            : null;

    const {
        data: team
    } = await supabase
        .from("teams")
        .select(
            "name, logo_url, role_id"
        )
        .eq(
            "guild_id",
            contract.guild_id
        )
        .eq(
            "role_id",
            contract.team_role_id
        )
        .maybeSingle();

    // ==============================================
    // SE ACEITOU → ADICIONAR CARGO
    // ==============================================

    if (
        newStatus === "accepted" &&
        guild &&
        teamRole
    ) {

        const adicionou =
            await adicionarCargoTime({

                guild:
                    guild,

                playerId:
                    contract.player_id,

                roleId:
                    contract.team_role_id

            });

        if (!adicionou) {

            console.error(
                "❌ Não foi possível adicionar o cargo do time ao jogador."
            );

        }

    }

    // ==============================================
    // ATUALIZAR CONTRATO NA MENSAGEM
    // ==============================================

    const container =
        criarContratoContainer({

            manager:
                manager ||
                `<@${contract.manager_id}>`,

            player:
                player ||
                `<@${contract.player_id}>`,

            teamName:
                team?.name ||
                teamRole?.name ||
                "Time não encontrado",

            position:
                contract.position,

            funcao:
                contract.function,

            contractId:
                contract.id,

            status:
                newStatus,

            logoUrl:
                team?.logo_url ||
                null

        });

    await interaction.update({

        components: [
            container
        ]

    });

    // ==============================================
    // REGISTRAR LOG
    // ==============================================

    await registrarContrato({

        client:
            interaction.client,

        contract:
            contract,

        status:
            newStatus

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

    contractCommand,

    releaseCommand,

    autoreleaseCommand,

    executarComando,

    processarBotaoContrato

};