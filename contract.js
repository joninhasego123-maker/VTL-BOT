const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require("discord.js");

const supabase = require("./supabase");

// ======================================================
// CONFIGURAÇÕES
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

// ======================================================
// VERIFICAR CANAL
// ======================================================

function verificarCanal(interaction) {
    return interaction.channelId === CONTRACT_CHANNEL_ID;
}

// ======================================================
// CONTAINER DO CONTRATO
// ======================================================

function criarContratoContainer({
    manager,
    player,
    teamRole,
    position,
    funcao,
    contractId,
    status = "pending"
}) {

    let statusText = "⏳ Aguardando resposta do jogador.";

    if (status === "accepted") {
        statusText = "✅ Contrato aceito pelo jogador.";
    }

    if (status === "declined") {
        statusText = "❌ Contrato recusado pelo jogador.";
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "## 📄 CONTRATO OFICIAL\n\n" +
            `**Time:** ${teamRole}\n` +
            `**Manager:** ${manager}\n` +
            `**Manager ID:** \`${manager.id}\`\n` +
            `**Player:** ${player}\n` +
            `**Player ID:** \`${player.id}\`\n\n` +
            `**Posição:** ${position}\n` +
            `**Função:** ${funcao}\n\n` +
            `**Status:** ${statusText}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    if (status === "pending") {

        const row =
            new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `contract_accept_${contractId}`
                    )
                    .setLabel("Aceitar")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(
                        `contract_decline_${contractId}`
                    )
                    .setLabel("Recusar")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            );

        container.addActionRowComponents(row);
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "-# VTL - CONTRACT SYSTEM"
        )
    );

    return container;
}

// ======================================================
// REGISTRAR RESULTADO DO CONTRATO
// ======================================================

async function registrarContrato({
    interaction,
    manager,
    player,
    teamRole,
    position,
    funcao,
    status
}) {

    try {

        const logChannel =
            interaction.guild.channels.cache.get(
                CONTRACT_LOG_CHANNEL_ID
            );

        if (!logChannel) {

            console.error(
                `❌ Canal de logs não encontrado: ${CONTRACT_LOG_CHANNEL_ID}`
            );

            return;
        }

        let statusText = "❓ Desconhecido";

        if (status === "accepted") {
            statusText = "✅ ACEITO";
        }

        if (status === "declined") {
            statusText = "❌ RECUSADO";
        }

        const container =
            new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "## 📋 RESULTADO DO CONTRATO\n\n" +
                `**Status:** ${statusText}\n\n` +
                `**Time:** ${teamRole}\n` +
                `**Manager:** ${manager}\n` +
                `**Manager ID:** \`${manager.id}\`\n` +
                `**Player:** ${player}\n` +
                `**Player ID:** \`${player.id}\`\n\n` +
                `**Posição:** ${position}\n` +
                `**Função:** ${funcao}`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "-# VTL - CONTRACT SYSTEM"
            )
        );

        await logChannel.send({
            components: [container],
            flags: 1 << 15
        });

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
                    "Cargo do time que o Manager poderá gerenciar."
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
            "Lista os Managers autorizados neste servidor."
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
                    ...POSITIONS.map(position => ({
                        name: position,
                        value: position
                    }))
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
                    ...FUNCTIONS.map(funcao => ({
                        name: funcao,
                        value: funcao
                    }))
                )
        );

// ======================================================
// /RELEASE
// ======================================================

const releaseCommand =
    new SlashCommandBuilder()
        .setName("release")
        .setDescription(
            "Libera um jogador do time."
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
// EXECUTAR COMANDOS
// ======================================================

async function executarComando(interaction) {

    // ==================================================
    // /CRIARTIME
    // ==================================================

    if (interaction.commandName === "criartime") {

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

        if (!interaction.guildId) {

            return interaction.reply({
                content:
                    "❌ Este comando só pode ser usado em um servidor.",
                ephemeral: true
            });
        }

        const nome =
            interaction.options.getString("nome")
                .trim();

        const logo =
            interaction.options.getAttachment("logo");

        const cargo =
            interaction.options.getRole("cargo");

        // ----------------------------------------------
        // VERIFICAR IMAGEM
        // ----------------------------------------------

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

        // ----------------------------------------------
        // VERIFICAR SE O CARGO JÁ É UM TIME
        // ----------------------------------------------

        const {
            data: timeExistente,
            error: buscaError
        } = await supabase
            .from("teams")
            .select("id, name")
            .eq("guild_id", interaction.guildId)
            .eq("role_id", cargo.id)
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

        // ----------------------------------------------
        // VERIFICAR NOME DUPLICADO
        // ----------------------------------------------

        const {
            data: nomeExistente,
            error: nomeError
        } = await supabase
            .from("teams")
            .select("id")
            .eq("guild_id", interaction.guildId)
            .ilike("name", nome)
            .maybeSingle();

        if (nomeError) {

            console.error(
                "❌ Erro ao verificar nome do time:",
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

        // ----------------------------------------------
        // SALVAR TIME
        // ----------------------------------------------

        const {
            data: time,
            error: insertError
        } = await supabase
            .from("teams")
            .insert({
                guild_id: interaction.guildId,
                name: nome,
                logo_url: logo.url,
                role_id: cargo.id,
                created_by: interaction.user.id
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

        // ----------------------------------------------
        // RESPOSTA
        // ----------------------------------------------

        const container =
            new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
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
            new TextDisplayBuilder().setContent(
                "-# VTL - CONTRACT SYSTEM"
            )
        );

        return interaction.reply({
            components: [container],
            flags: 1 << 15
        });
    }

    // ==================================================
    // /PERM
    // ==================================================

    if (interaction.commandName === "perm") {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador para usar este comando.",
                ephemeral: true
            });
        }

        if (!interaction.guildId) {

            return interaction.reply({
                content:
                    "❌ Este comando só pode ser usado em um servidor.",
                ephemeral: true
            });
        }

        const manager =
            interaction.options.getUser("manager");

        const teamRole =
            interaction.options.getRole("time");

        // ----------------------------------------------
        // VERIFICAR SE O TIME ESTÁ CADASTRADO
        // ----------------------------------------------

        const {
            data: team,
            error: teamError
        } = await supabase
            .from("teams")
            .select("*")
            .eq("guild_id", interaction.guildId)
            .eq("role_id", teamRole.id)
            .maybeSingle();

        if (teamError) {

            console.error(
                "❌ Erro ao verificar time no /perm:",
                teamError
            );

            return interaction.reply({
                content:
                    "❌ Não foi possível verificar se o time está cadastrado.",
                ephemeral: true
            });
        }

        if (!team) {

            return interaction.reply({
                content:
                    `❌ O cargo ${teamRole} não está cadastrado como um time da VTL.\n\n` +
                    "Cadastre o time primeiro usando `/criartime`.",
                ephemeral: true
            });
        }

        // ----------------------------------------------
        // SALVAR PERMISSÃO
        // ----------------------------------------------

        const { error } =
            await supabase
                .from("manager_permissions")
                .upsert(
                    {
                        guild_id: interaction.guildId,
                        manager_id: manager.id,
                        team_role_id: teamRole.id
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
                `✅ ${manager} agora possui permissão de Manager para o time ${teamRole} (**${team.name}**).`,
            ephemeral: true
        });
    }

    // ==================================================
    // /UNPERM
    // ==================================================

    if (interaction.commandName === "unperm") {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador para usar este comando.",
                ephemeral: true
            });
        }

        const manager =
            interaction.options.getUser("manager");

        const { error } =
            await supabase
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
                `✅ A permissão de ${manager} foi removida neste servidor.`,
            ephemeral: true
        });
    }

    // ==================================================
    // /PERMLIST
    // ==================================================

    if (interaction.commandName === "permlist") {

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Você precisa ser administrador para usar este comando.",
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
                    "❌ Não foi possível carregar a lista de permissões.",
                ephemeral: true
            });
        }

        if (!data || data.length === 0) {

            return interaction.reply({
                content:
                    "📋 **Lista de Managers**\n\n" +
                    "Nenhum Manager possui permissão neste servidor.",
                ephemeral: true
            });
        }

        let lista = "";

        for (const permission of data) {

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

            const managerText =
                manager
                    ? `${manager} (\`${permission.manager_id}\`)`
                    : `\`${permission.manager_id}\``;

            const roleText =
                role
                    ? role.toString()
                    : `\`${permission.team_role_id}\``;

            lista +=
                `👤 **Manager:** ${managerText}\n` +
                `⚽ **Time:** ${roleText}\n\n`;
        }

        const container =
            new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "## 📋 MANAGERS AUTORIZADOS\n\n" +
                lista
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "-# VTL - CONTRACT SYSTEM"
            )
        );

        return interaction.reply({
            components: [container],
            flags: 1 << 15,
            ephemeral: true
        });
    }

    // ==================================================
    // VERIFICAR CANAL
    // ==================================================

    if (
        interaction.commandName === "contract" ||
        interaction.commandName === "release"
    ) {

        if (!verificarCanal(interaction)) {

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

    if (interaction.commandName === "contract") {

        const managerId =
            interaction.user.id;

        const player =
            interaction.options.getUser("player");

        const position =
            interaction.options.getString("posicao");

        const funcao =
            interaction.options.getString("funcao");

        // ----------------------------------------------
        // BUSCAR PERMISSÃO
        // ----------------------------------------------

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
                    "❌ Você não possui permissão de Manager neste servidor.\n" +
                    "Um administrador precisa usar `/perm` primeiro.",
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
                    "❌ O cargo do seu time não foi encontrado neste servidor.",
                ephemeral: true
            });
        }

        // ----------------------------------------------
        // VERIFICAR SE O TIME AINDA ESTÁ CADASTRADO
        // ----------------------------------------------

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
                    "❌ Não foi possível verificar o cadastro do seu time.",
                ephemeral: true
            });
        }

        if (!team) {

            return interaction.reply({
                content:
                    "❌ Seu time não está mais cadastrado na VTL.",
                ephemeral: true
            });
        }

        // ----------------------------------------------
        // VERIFICAR CONTRATO EXISTENTE
        // ----------------------------------------------

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

        // ----------------------------------------------
        // CRIAR CONTRATO
        // ----------------------------------------------

        const {
            data: contract,
            error: contractError
        } = await supabase
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

        // ----------------------------------------------
        // CONTRATO
        // ----------------------------------------------

        const container =
            criarContratoContainer({
                manager: interaction.user,
                player: player,
                teamRole: teamRole,
                position: position,
                funcao: funcao,
                contractId: contract.id,
                status: "pending"
            });

        const contractMessage =
            await interaction.channel.send({
                components: [container],
                flags: 1 << 15
            });

        // ----------------------------------------------
        // SALVAR MENSAGEM
        // ----------------------------------------------

        await supabase
            .from("contracts")
            .update({
                message_id: contractMessage.id,
                channel_id: interaction.channelId
            })
            .eq(
                "id",
                contract.id
            );

        // ----------------------------------------------
        // DM
        // ----------------------------------------------

        try {

            const dm =
                await player.createDM();

            const dmContainer =
                criarContratoContainer({
                    manager: interaction.user,
                    player: player,
                    teamRole: teamRole,
                    position: position,
                    funcao: funcao,
                    contractId: contract.id,
                    status: "pending"
                });

            await dm.send({
                components: [dmContainer],
                flags: 1 << 15
            });

        } catch (error) {

            console.log(
                `⚠️ Não foi possível enviar DM para ${player.tag}.`
            );

            const fallbackChannel =
                interaction.guild.channels.cache.get(
                    CONTRACT_LOG_CHANNEL_ID
                );

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

    if (interaction.commandName === "release") {

        const managerId =
            interaction.user.id;

        const player =
            interaction.options.getUser("player");

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

            console.error(
                "❌ Erro ao verificar permissão no /release:",
                permissionError
            );

            return interaction.reply({
                content:
                    "❌ Erro ao verificar sua permissão.",
                ephemeral: true
            });
        }

        if (!permission) {

            return interaction.reply({
                content:
                    "❌ Você não possui permissão de Manager neste servidor.",
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

        const {
            error: releaseError
        } = await supabase
            .from("contracts")
            .update({
                status: "released"
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
                    "❌ Não foi possível liberar o jogador.",
                ephemeral: true
            });
        }

        return interaction.reply({
            content:
                `✅ ${player} foi liberado do time.`,
            ephemeral: true
        });
    }

    return false;
}

// ======================================================
// PROCESSAR BOTÕES
// ======================================================

async function processarBotaoContrato(interaction) {

    if (!interaction.isButton()) {
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

    // ----------------------------------------------
    // BUSCAR CONTRATO
    // ----------------------------------------------

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

        return interaction.reply({
            content:
                "❌ Este contrato não foi encontrado.",
            ephemeral: true
        });
    }

    // ----------------------------------------------
    // VERIFICAR JOGADOR
    // ----------------------------------------------

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

    // ----------------------------------------------
    // VERIFICAR STATUS
    // ----------------------------------------------

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

    // ----------------------------------------------
    // ATUALIZAR
    // ----------------------------------------------

    const {
        error: updateError
    } = await supabase
        .from("contracts")
        .update({
            status: newStatus
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

    // ----------------------------------------------
    // BUSCAR DADOS
    // ----------------------------------------------

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

    const guild =
        interaction.guild;

    const teamRole =
        guild
            ? guild.roles.cache.get(
                contract.team_role_id
            )
            : null;

    // ----------------------------------------------
    // CONTAINER ATUALIZADO
    // ----------------------------------------------

    const container =
        criarContratoContainer({
            manager:
                manager ||
                `<@${contract.manager_id}>`,

            player:
                player ||
                `<@${contract.player_id}>`,

            teamRole:
                teamRole ||
                `<@&${contract.team_role_id}>`,

            position:
                contract.position,

            funcao:
                contract.function,

            contractId:
                contract.id,

            status:
                newStatus
        });

    // ----------------------------------------------
    // ATUALIZAR MENSAGEM
    // ----------------------------------------------

    await interaction.update({
        components: [container],
        flags: 1 << 15
    });

    // ----------------------------------------------
    // LOG
    // ----------------------------------------------

    if (
        guild &&
        manager &&
        player &&
        teamRole
    ) {

        await registrarContrato({
            interaction,
            manager,
            player,
            teamRole,
            position:
                contract.position,
            funcao:
                contract.function,
            status:
                newStatus
        });

    } else {

        console.error(
            "❌ Não foi possível registrar o contrato nos logs porque faltam dados."
        );
    }

    return true;
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    criarTimeCommand,
    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand,
    executarComando,
    processarBotaoContrato
};