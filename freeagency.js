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
        .setDescription("Envia seu jogador para a lista de Free Agents.");

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
// CONTAINER FREE AGENCY
// ======================================================

function criarFreeAgencyContainer({
    user,
    descricao
}) {

    const container =
        new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "## 🟢 FREE AGENCY\n\n" +
            `**Jogador:** ${user}\n` +
            `**ID:** \`${user.id}\`\n\n` +
            `**Descrição:**\n${descricao}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "Jogador disponível para contratação."
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
            "-# VTL - FREE AGENCY"
        )
    );

    return container;
}

// ======================================================
// EXECUTAR COMANDO
// ======================================================

async function executarFreeAgency(interaction) {

    if (
        interaction.channelId !==
        FREEAGENCY_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ O comando deve ser usado em <#${FREEAGENCY_CHANNEL_ID}>.`,
            ephemeral: true
        });
    }

    return abrirModalFreeAgency(interaction);
}

// ======================================================
// INTERAÇÃO DO MODAL
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
                "❌ Não foi possível encontrar o canal de Free Agency.",
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

    await interaction.reply({
        content:
            "✅ Seu jogador foi enviado para a Free Agency!",
        ephemeral: true
    });

    return true;
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    freeagencyCommand: {
        ...freeagencyCommand,

        execute: executarFreeAgency
    },

    handleFreeAgencyInteraction
};
