const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MessageFlags
} = require("discord.js");

const config = require("./config");

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const FREEAGENCY_CHANNEL_ID =
    config.FREEAGENCY_CHANNEL_ID;

// ======================================================
// COMANDO
// ======================================================

const freeagencyCommand =
    new SlashCommandBuilder()
        .setName("freeagency")
        .setDescription("Envia seu jogador para a Free Agency.");

// ======================================================
// MODAL
// ======================================================

function abrirModalFreeAgency(interaction) {

    const modal =
        new ModalBuilder()
            .setCustomId("modal_freeagency")
            .setTitle("Free Agency");

    const descricao =
        new TextInputBuilder()
            .setCustomId("descricao")
            .setLabel("Descrição")
            .setPlaceholder("Fale um pouco sobre o jogador...")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            descricao
        )
    );

    return interaction.showModal(modal);
}

// ======================================================
// CONTAINER
// ======================================================

function criarFreeAgencyContainer({
    user,
    descricao
}) {

    const container =
        new ContainerBuilder();

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "## 🟢 FREE AGENCY\n\n" +
                    `**Jogador:** ${user}\n` +
                    `**ID:** \`${user.id}\`\n\n` +
                    `**Descrição:**\n${descricao}`
                )
            )
            .setThumbnail(
                new ThumbnailBuilder()
                    .setURL(
                        user.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                    )
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "🟢 Este jogador está disponível para contratação."
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "-# VTL - FREE AGENCY"
        )
    );

    return container;
}

// ======================================================
// EXECUTAR /FREEAGENCY
// ======================================================

async function executarFreeAgency(interaction) {

    // NÃO verifica o canal.
    // O comando pode ser usado em qualquer canal.

    return abrirModalFreeAgency(interaction);
}

// ======================================================
// PROCESSAR MODAL
// ======================================================

async function handleFreeAgencyInteraction(interaction) {

    if (
        !interaction.isModalSubmit() ||
        interaction.customId !== "modal_freeagency"
    ) {
        return false;
    }

    const descricao =
        interaction.fields.getTextInputValue(
            "descricao"
        );

    const canal =
        interaction.guild.channels.cache.get(
            FREEAGENCY_CHANNEL_ID
        );

    if (!canal) {

        return interaction.reply({
            content:
                `❌ Não encontrei o canal de Free Agency (<#${FREEAGENCY_CHANNEL_ID}>).`,
            ephemeral: true
        });
    }

    const container =
        criarFreeAgencyContainer({
            user: interaction.user,
            descricao
        });

    await canal.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });

    return interaction.reply({
        content:
            `✅ Seu jogador foi enviado para <#${FREEAGENCY_CHANNEL_ID}>!`,
        ephemeral: true
    });
}

// ======================================================
// EXPORTS
// ======================================================

freeagencyCommand.execute =
    executarFreeAgency;

module.exports = {
    freeagencyCommand,
    handleFreeAgencyInteraction
};
