const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require("discord.js");

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const SHOUTS_CHANNEL_ID = "1554499886815125896";

const SHOUTS_ROLE_ID = "1554507724169936896";

// ======================================================
// COMANDO /SHOUTS
// ======================================================

const shoutsCommand = new SlashCommandBuilder()
    .setName("shouts")
    .setDescription("Envia um shout para os jogadores de dois times.")
    .setDefaultMemberPermissions("8");

// ======================================================
// ABRIR MODAL
// ======================================================

async function executarShouts(interaction) {

    // Proteção extra
    if (
        !interaction.memberPermissions ||
        !interaction.memberPermissions.has("Administrator")
    ) {
        await interaction.reply({
            content:
                "❌ Você precisa ter **Administrador** para usar este comando.",
            ephemeral: true
        });

        return true;
    }

    const modal = new ModalBuilder()
        .setCustomId("modal_shouts")
        .setTitle("SHOUTS 📢");

    // HOME
    const homeInput = new TextInputBuilder()
        .setCustomId("shouts_home")
        .setLabel("Cargo do time da casa")
        .setPlaceholder("ID ou menção do cargo")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    // AWAY
    const awayInput = new TextInputBuilder()
        .setCustomId("shouts_away")
        .setLabel("Cargo do time away")
        .setPlaceholder("ID ou menção do cargo")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    // NICK
    const nickInput = new TextInputBuilder()
        .setCustomId("shouts_nick")
        .setLabel("Nick")
        .setPlaceholder("Digite o nick")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    // LINK
    const linkInput = new TextInputBuilder()
        .setCustomId("shouts_link")
        .setLabel("Link")
        .setPlaceholder("Cole o link")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(homeInput),
        new ActionRowBuilder().addComponents(awayInput),
        new ActionRowBuilder().addComponents(nickInput),
        new ActionRowBuilder().addComponents(linkInput)
    );

    await interaction.showModal(modal);

    return true;
}

// ======================================================
// PEGAR ID DO CARGO
// ======================================================

function extrairRoleId(texto) {

    if (!texto) {
        return null;
    }

    // <@&123456789>
    const mention =
        texto.match(/^<@&(\d+)>$/);

    if (mention) {
        return mention[1];
    }

    // ID puro
    const id =
        texto.match(/^(\d+)$/);

    if (id) {
        return id[1];
    }

    return null;
}

// ======================================================
// PROCESSAR MODAL
// ======================================================

async function processarShouts(interaction) {

    if (
        !interaction.isModalSubmit() ||
        interaction.customId !== "modal_shouts"
    ) {
        return false;
    }

    try {

        // ==============================================
        // DADOS DO MODAL
        // ==============================================

        const homeTexto =
            interaction.fields.getTextInputValue(
                "shouts_home"
            );

        const awayTexto =
            interaction.fields.getTextInputValue(
                "shouts_away"
            );

        const nick =
            interaction.fields.getTextInputValue(
                "shouts_nick"
            );

        const link =
            interaction.fields.getTextInputValue(
                "shouts_link"
            );

        // ==============================================
        // EXTRAIR IDS
        // ==============================================

        const homeRoleId =
            extrairRoleId(homeTexto);

        const awayRoleId =
            extrairRoleId(awayTexto);

        if (!homeRoleId || !awayRoleId) {

            await interaction.reply({
                content:
                    "❌ Um dos cargos informados é inválido.\n\nUse uma menção como `<@&ID>` ou coloque somente o ID do cargo.",
                ephemeral: true
            });

            return true;
        }

        // ==============================================
        // PEGAR GUILD
        // ==============================================

        const guild =
            interaction.guild;

        if (!guild) {

            await interaction.reply({
                content:
                    "❌ Este comando só pode ser usado dentro do servidor.",
                ephemeral: true
            });

            return true;
        }

        // ==============================================
        // VERIFICAR CARGOS
        // ==============================================

        const homeRole =
            guild.roles.cache.get(
                homeRoleId
            );

        const awayRole =
            guild.roles.cache.get(
                awayRoleId
            );

        if (!homeRole) {

            await interaction.reply({
                content:
                    `❌ O cargo da Home não foi encontrado.\nID: \`${homeRoleId}\``,
                ephemeral: true
            });

            return true;
        }

        if (!awayRole) {

            await interaction.reply({
                content:
                    `❌ O cargo da Away não foi encontrado.\nID: \`${awayRoleId}\``,
                ephemeral: true
            });

            return true;
        }

        // ==============================================
        // BUSCAR MEMBROS
        // ==============================================

        await guild.members.fetch();

        const membros = new Map();

        for (const member of homeRole.members.values()) {
            membros.set(
                member.id,
                member
            );
        }

        for (const member of awayRole.members.values()) {
            membros.set(
                member.id,
                member
            );
        }

        // ==============================================
        // CRIAR SHOUT
        // ==============================================

        const container =
            new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "# SHOUTS 📢"
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `${homeRole} ⚔️ ${awayRole}`
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `**Ref:** ${interaction.user}\n` +
                    `**Nick:** ${nick}\n` +
                    `**Link:** ${link}`
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "-# VTL • Champions League"
                )
        );

        // ==============================================
        // ENVIAR PARA O CANAL
        // ==============================================

        const canal =
            await guild.channels.fetch(
                SHOUTS_CHANNEL_ID
            );

        if (!canal) {

            await interaction.reply({
                content:
                    "❌ O canal de Shouts não foi encontrado.",
                ephemeral: true
            });

            return true;
        }

        await canal.send({
            components: [
                container
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

        // ==============================================
        // ENVIAR PARA AS DMs
        // ==============================================

        let enviados = 0;
        let falharam = 0;

        for (const member of membros.values()) {

            if (member.user.bot) {
                continue;
            }

            try {

                await member.send({
                    components: [
                        container
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                enviados++;

            } catch (error) {

                falharam++;

                console.log(
                    `⚠️ Não foi possível enviar DM para ${member.user.tag}`
                );
            }
        }

        // ==============================================
        // RESPOSTA
        // ==============================================

        await interaction.reply({
            content:
                `✅ Shout enviado com sucesso!\n\n` +
                `🏠 **Home:** ${homeRole}\n` +
                `⚔️ **Away:** ${awayRole}\n` +
                `📨 **DMs enviadas:** ${enviados}\n` +
                `❌ **DMs bloqueadas:** ${falharam}`,
            ephemeral: true
        });

        return true;

    } catch (error) {

        console.error(
            "❌ Erro no sistema de Shouts:",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({
                content:
                    "❌ Ocorreu um erro ao enviar o shout.",
                ephemeral: true
            });

        } else {

            await interaction.reply({
                content:
                    "❌ Ocorreu um erro ao enviar o shout.",
                ephemeral: true
            });

        }

        return true;
    }
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    shoutsCommand,
    executarShouts,
    processarShouts
};