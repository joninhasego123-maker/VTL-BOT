const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require("discord.js");

const config = require("./config");
const supabase = require("./supabase");

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const CONTRACT_CHANNEL_ID =
    config.CONTRACT_CHANNEL_ID;

const CONTRACT_LOG_CHANNEL_ID =
    config.CONTRACT_LOG_CHANNEL_ID;

// ======================================================
// TIMES / CARGOS
// ======================================================

const TEAMS = [
    {
        name: "Corinthians",
        roleId: "1550260388866691213"
    },
    {
        name: "Flamengo",
        roleId: "1550259753903718450"
    },
    {
        name: "Cruzeiro",
        roleId: "1550259441054654494"
    },
    {
        name: "Grêmio",
        roleId: "1550259517105766410"
    },
    {
        name: "Atlético Mineiro",
        roleId: "1550259846010380368"
    },
    {
        name: "Vitória",
        roleId: "1550260303474729061"
    },
    {
        name: "Bahia",
        roleId: "1550260226551185508"
    },
    {
        name: "São Paulo",
        roleId: "1550260711979221062"
    },
    {
        name: "Palmeiras",
        roleId: "1550260057021882508"
    },
    {
        name: "Internacional",
        roleId: "1550259618889072650"
    }
];

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function getTeamByRoleId(roleId) {
    return TEAMS.find(team => team.roleId === roleId);
}

function getTeamByName(name) {
    return TEAMS.find(
        team =>
            team.name.toLowerCase() ===
            name.toLowerCase()
    );
}

function criarContainerContrato({
    guild,
    manager,
    player,
    team,
    position,
    funcao
}) {

    const container =
        new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "## 📄 CONTRATO VTL\n\n" +

            `**Team:** ${team.name}\n` +
            `**Manager:** ${manager}\n` +
            `**Manager ID:** \`${manager.id}\`\n\n` +

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
            "O jogador deve aceitar ou recusar este contrato."
        )
    );

    const aceitarId =
        `contract_accept_${manager.id}_${player.id}_${team.roleId}`;

    const recusarId =
        `contract_decline_${manager.id}_${player.id}_${team.roleId}`;

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId(aceitarId)
                .setLabel("Aceitar")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(recusarId)
                .setLabel("Recusar")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger)

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

    return container;
}

// ======================================================
// VERIFICAR PERMISSÃO DO MANAGER
// ======================================================

async function verificarPermissao(
    guildId,
    managerId,
    teamRoleId
) {

    const {
        data,
        error
    } = await supabase
        .from("manager_permissions")
        .select("*")
        .eq("guild_id", guildId)
        .eq("manager_id", managerId)
        .eq("team_role_id", teamRoleId)
        .maybeSingle();

    if (error) {

        console.error(
            "❌ Erro ao verificar permissão:",
            error
        );

        return false;
    }

    return !!data;
}

// ======================================================
// COMANDO /PERM
// ======================================================

const permCommand =
    new SlashCommandBuilder()
        .setName("perm")
        .setDescription("Concede permissão de Manager para um usuário.")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuário que receberá a permissão.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("time")
                .setDescription("Cargo do time que o Manager poderá administrar.")
                .setRequired(true)
        );

// ======================================================
// COMANDO /UNPERM
// ======================================================

const unpermCommand =
    new SlashCommandBuilder()
        .setName("unperm")
        .setDescription("Remove a permissão de Manager.")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuário que perderá a permissão.")
                .setRequired(true)
        );

// ======================================================
// COMANDO /PERMLIST
// ======================================================

const permlistCommand =
    new SlashCommandBuilder()
        .setName("permlist")
        .setDescription("Mostra as permissões de Manager deste servidor.");

// ======================================================
// COMANDO /CONTRACT
// ======================================================

const contractCommand =
    new SlashCommandBuilder()
        .setName("contract")
        .setDescription("Envia um contrato para um jogador.")
        .addUserOption(option =>
            option
                .setName("jogador")
                .setDescription("Jogador que receberá o contrato.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("time")
                .setDescription("Cargo do time.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("posicao")
                .setDescription("Posição do jogador.")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Goleiro",
                        value: "Goleiro"
                    },
                    {
                        name: "Zagueiro",
                        value: "Zagueiro"
                    },
                    {
                        name: "Volante",
                        value: "Volante"
                    },
                    {
                        name: "Meia",
                        value: "Meia"
                    },
                    {
                        name: "Atacante",
                        value: "Atacante"
                    }
                )
        )
        .addStringOption(option =>
            option
                .setName("funcao")
                .setDescription("Função do jogador.")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Titular",
                        value: "Titular"
                    },
                    {
                        name: "Reserva",
                        value: "Reserva"
                    }
                )
        );

// ======================================================
// COMANDO /RELEASE
// ======================================================

const releaseCommand =
    new SlashCommandBuilder()
        .setName("release")
        .setDescription("Libera um jogador do seu time.")
        .addUserOption(option =>
            option
                .setName("jogador")
                .setDescription("Jogador que será liberado.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("time")
                .setDescription("Time do jogador.")
                .setRequired(true)
        );

// ======================================================
// /PERM
// ======================================================

async function executarPerm(interaction) {

    if (
        interaction.channelId !==
        CONTRACT_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`,
            ephemeral: true
        });
    }

    const usuario =
        interaction.options.getUser("usuario");

    const cargo =
        interaction.options.getRole("time");

    const team =
        getTeamByRoleId(cargo.id);

    if (!team) {

        return interaction.reply({
            content:
                "❌ Esse cargo não pertence aos times da VTL.",
            ephemeral: true
        });
    }

    const {
        error
    } = await supabase
        .from("manager_permissions")
        .upsert(
            {
                guild_id: interaction.guildId,
                manager_id: usuario.id,
                team_role_id: team.roleId
            },
            {
                onConflict:
                    "guild_id,manager_id"
            }
        );

    if (error) {

        console.error(
            "❌ Erro ao salvar permissão:",
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
            `✅ ${usuario} agora possui permissão de Manager do **${team.name}**.`,
        ephemeral: true
    });
}

// ======================================================
// /UNPERM
// ======================================================

async function executarUnperm(interaction) {

    if (
        interaction.channelId !==
        CONTRACT_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`,
            ephemeral: true
        });
    }

    const usuario =
        interaction.options.getUser("usuario");

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
            usuario.id
        );

    if (error) {

        console.error(
            "❌ Erro ao remover permissão:",
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
            `✅ Permissões de ${usuario} removidas.`,
        ephemeral: true
    });
}

// ======================================================
// /PERMLIST
// ======================================================

async function executarPermlist(interaction) {

    if (
        interaction.channelId !==
        CONTRACT_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`,
            ephemeral: true
        });
    }

    const {
        data,
        error
    } = await supabase
        .from("manager_permissions")
        .select("*")
        .eq(
            "guild_id",
            interaction.guildId
        );

    if (error) {

        console.error(
            "❌ Erro ao buscar permissões:",
            error
        );

        return interaction.reply({
            content:
                "❌ Não foi possível buscar as permissões.",
            ephemeral: true
        });
    }

    if (!data || data.length === 0) {

        return interaction.reply({
            content:
                "📋 Não existem permissões de Manager cadastradas.",
            ephemeral: true
        });
    }

    let texto =
        "## 📋 PERMISSÕES DE MANAGER\n\n";

    for (const permission of data) {

        const team =
            getTeamByRoleId(
                permission.team_role_id
            );

        texto +=
            `**Manager:** <@${permission.manager_id}>\n` +
            `**Time:** ${team ? team.name : "Desconhecido"}\n\n`;
    }

    return interaction.reply({
        content: texto,
        ephemeral: true
    });
}

// ======================================================
// /CONTRACT
// ======================================================

async function executarContract(interaction) {

    if (
        interaction.channelId !==
        CONTRACT_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`,
            ephemeral: true
        });
    }

    const jogador =
        interaction.options.getUser("jogador");

    const cargo =
        interaction.options.getRole("time");

    const posicao =
        interaction.options.getString("posicao");

    const funcao =
        interaction.options.getString("funcao");

    const team =
        getTeamByRoleId(cargo.id);

    if (!team) {

        return interaction.reply({
            content:
                "❌ Esse cargo não pertence aos times da VTL.",
            ephemeral: true
        });
    }

    const permitido =
        await verificarPermissao(
            interaction.guildId,
            interaction.user.id,
            team.roleId
        );

    if (!permitido) {

        return interaction.reply({
            content:
                `❌ Você não possui permissão para enviar contratos do **${team.name}**.`,
            ephemeral: true
        });
    }

    if (jogador.bot) {

        return interaction.reply({
            content:
                "❌ Você não pode enviar um contrato para um bot.",
            ephemeral: true
        });
    }

    const container =
        criarContainerContrato({
            guild: interaction.guild,
            manager: interaction.user,
            player: jogador,
            team,
            position: posicao,
            funcao
        });

    // ==============================================
    // MENSAGEM NO CANAL
    // ==============================================

    await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });

    // ==============================================
    // ENVIAR DM
    // ==============================================

    try {

        await jogador.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {

        console.error(
            `⚠️ Não foi possível enviar DM para ${jogador.tag}:`,
            error
        );

        const logChannel =
            interaction.guild.channels.cache.get(
                CONTRACT_LOG_CHANNEL_ID
            );

        if (logChannel) {

            await logChannel.send({
                content:
                    `⚠️ ${jogador} não pôde receber o contrato por DM.\n` +
                    `Contrato enviado por ${interaction.user} para o time **${team.name}**.`
            }).catch(() => {});
        }
    }
}

// ======================================================
// /RELEASE
// ======================================================

async function executarRelease(interaction) {

    if (
        interaction.channelId !==
        CONTRACT_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ Este comando só pode ser usado em <#${CONTRACT_CHANNEL_ID}>.`,
            ephemeral: true
        });
    }

    const jogador =
        interaction.options.getUser("jogador");

    const cargo =
        interaction.options.getRole("time");

    const team =
        getTeamByRoleId(cargo.id);

    if (!team) {

        return interaction.reply({
            content:
                "❌ Esse cargo não pertence aos times da VTL.",
            ephemeral: true
        });
    }

    const permitido =
        await verificarPermissao(
            interaction.guildId,
            interaction.user.id,
            team.roleId
        );

    if (!permitido) {

        return interaction.reply({
            content:
                `❌ Você não possui permissão para administrar o **${team.name}**.`,
            ephemeral: true
        });
    }

    const member =
        await interaction.guild.members
            .fetch(jogador.id)
            .catch(() => null);

    if (!member) {

        return interaction.reply({
            content:
                "❌ Jogador não encontrado no servidor.",
            ephemeral: true
        });
    }

    if (
        !member.roles.cache.has(
            team.roleId
        )
    ) {

        return interaction.reply({
            content:
                `❌ ${jogador} não possui o cargo do **${team.name}**.`,
            ephemeral: true
        });
    }

    await member.roles.remove(
        team.roleId
    );

    return interaction.reply({
        content:
            `✅ ${jogador} foi liberado do **${team.name}**.`,
        ephemeral: true
    });
}

// ======================================================
// BOTÕES DO CONTRATO
// ======================================================

async function processarBotaoContrato(interaction) {

    if (!interaction.isButton()) {
        return false;
    }

    const customId =
        interaction.customId;

    const isAccept =
        customId.startsWith(
            "contract_accept_"
        );

    const isDecline =
        customId.startsWith(
            "contract_decline_"
        );

    if (!isAccept && !isDecline) {
        return false;
    }

    const partes =
        customId.split("_");

    const managerId =
        partes[2];

    const playerId =
        partes[3];

    const teamRoleId =
        partes[4];

    // ==============================================
    // SOMENTE O JOGADOR PODE RESPONDER
    // ==============================================

    if (
        interaction.user.id !==
        playerId
    ) {

        return interaction.reply({
            content:
                "❌ Apenas o jogador que recebeu este contrato pode responder.",
            ephemeral: true
        });
    }

    const guild =
        interaction.guild;

    if (!guild) {

        return interaction.reply({
            content:
                "❌ Este contrato precisa ser processado dentro do servidor.",
            ephemeral: true
        });
    }

    const team =
        getTeamByRoleId(teamRoleId);

    if (!team) {

        return interaction.reply({
            content:
                "❌ O time deste contrato não foi encontrado.",
            ephemeral: true
        });
    }

    const member =
        await guild.members
            .fetch(playerId)
            .catch(() => null);

    if (!member) {

        return interaction.reply({
            content:
                "❌ Não foi possível encontrar o jogador no servidor.",
            ephemeral: true
        });
    }

    // ==============================================
    // RECUSAR
    // ==============================================

    if (isDecline) {

        await interaction.update({
            components: [
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "## ❌ CONTRATO RECUSADO\n\n" +
                            `**Jogador:** <@${playerId}>\n` +
                            `**Time:** ${team.name}\n\n` +
                            "O jogador recusou este contrato.\n\n" +
                            "-# VTL - CONTRACT SYSTEM"
                        )
                    )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const logChannel =
            guild.channels.cache.get(
                CONTRACT_LOG_CHANNEL_ID
            );

        if (logChannel) {

            await logChannel.send({
                content:
                    `❌ **Contrato recusado**\n\n` +
                    `**Jogador:** <@${playerId}>\n` +
                    `**Manager:** <@${managerId}>\n` +
                    `**Time:** ${team.name}`
            }).catch(() => {});
        }

        return true;
    }

    // ==============================================
    // ACEITAR
    // ==============================================

    try {

        await member.roles.add(
            team.roleId
        );

    } catch (error) {

        console.error(
            "❌ Erro ao adicionar cargo:",
            error
        );

        return interaction.reply({
            content:
                "❌ Não foi possível adicionar o cargo do time. Verifique a hierarquia de cargos do bot.",
            ephemeral: true
        });
    }

    await interaction.update({
        components: [
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "## ✅ CONTRATO ACEITO\n\n" +
                        `**Jogador:** <@${playerId}>\n` +
                        `**Time:** ${team.name}\n\n` +
                        "O jogador aceitou o contrato.\n\n" +
                        "-# VTL - CONTRACT SYSTEM"
                    )
                )
        ],
        flags: MessageFlags.IsComponentsV2
    });

    const logChannel =
        guild.channels.cache.get(
            CONTRACT_LOG_CHANNEL_ID
        );

    if (logChannel) {

        await logChannel.send({
            content:
                `✅ **Contrato aceito**\n\n` +
                `**Jogador:** <@${playerId}>\n` +
                `**Manager:** <@${managerId}>\n` +
                `**Time:** ${team.name}`
        }).catch(() => {});
    }

    return true;
}

// ======================================================
// EXECUTAR COMANDOS
// ======================================================

async function executarComando(interaction) {

    switch (interaction.commandName) {

        case "perm":
            return executarPerm(interaction);

        case "unperm":
            return executarUnperm(interaction);

        case "permlist":
            return executarPermlist(interaction);

        case "contract":
            return executarContract(interaction);

        case "release":
            return executarRelease(interaction);

        default:
            return false;
    }
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand,
    executarComando,
    processarBotaoContrato
};
