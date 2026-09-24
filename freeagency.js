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
// COMANDO /FREEAGENCY
// ======================================================

const freeagencyCommand =
    new SlashCommandBuilder()
        .setName("freeagency")
        .setDescription(
            "Coloca seu jogador na lista de Free Agency."
        );

// ======================================================
// MODAL
// ======================================================

function abrirModalFreeAgency(interaction) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                "modal_freeagency"
            )
            .setTitle(
                "Free Agency"
            );

    const descricao =
        new TextInputBuilder()
            .setCustomId(
                "descricao"
            )
            .setLabel(
                "Descrição do jogador"
            )
            .setPlaceholder(
                "Ex: Procuro time para jogar a temporada..."
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(
                descricao
            )
    );

    return interaction.showModal(modal);
}

// ======================================================
// EXECUTAR COMANDO
// ======================================================

async function executarFreeAgency(
    interaction
) {

    return abrirModalFreeAgency(
        interaction
    );
}

// ======================================================
// PROCESSAR MODAL
// ======================================================

async function processarFreeAgency(
    interaction
) {

    if (
        !interaction.isModalSubmit() ||
        interaction.customId !==
            "modal_freeagency"
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
                "❌ O canal de Free Agency não foi encontrado.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    // ==================================================
    // CONTAINER
    // ==================================================

    const container =
        new ContainerBuilder();

    // ==================================================
    // TÍTULO
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "## 🔓 FREE AGENCY"
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // JOGADOR
    // ==================================================

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `**Jogador:** ${interaction.user}\n` +
                        `**ID:** \`${interaction.user.id}\``
                    )
            )
            .setThumbnailAccessory(
                new ThumbnailBuilder()
                    .setURL(
                        interaction.user.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                    )
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // DESCRIÇÃO
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "**Descrição:**\n\n" +
                "```text\n" +
                descricao +
                "\n```"
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // FOOTER
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "-# VTL - FREE AGENCY"
            )
    );

    // ==================================================
    // ENVIAR
    // ==================================================

    await canal.send({
        components: [
            container
        ],
        flags:
            MessageFlags.IsComponentsV2
    });

    // ==================================================
    // RESPOSTA
    // ==================================================

    return interaction.reply({
        content:
            `✅ Seu jogador foi enviado para a Free Agency em <#${FREEAGENCY_CHANNEL_ID}>.`,
        flags:
            MessageFlags.Ephemeral
    });
}

// ======================================================
// EXPORTS
// ======================================================

freeagencyCommand.execute =
    executarFreeAgency;

module.exports = {
    freeagencyCommand,
    processarFreeAgency
};