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

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const SCOUTING_CHANNEL_ID =
    "1552633377503449098";

// ======================================================
// COMANDO /SCOUTING
// ======================================================

const scoutingCommand =
    new SlashCommandBuilder()
        .setName("scouting")
        .setDescription(
            "Envia seu jogador para a lista de Scouting."
        );

// ======================================================
// MODAL
// ======================================================

function abrirModalScouting(interaction) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                "modal_scouting"
            )
            .setTitle(
                "Scouting"
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
                "Ex: Procuro um time para jogar a temporada..."
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

async function executarScouting(
    interaction
) {

    return abrirModalScouting(
        interaction
    );
}

// ======================================================
// PROCESSAR MODAL
// ======================================================

async function processarScouting(
    interaction
) {

    if (
        !interaction.isModalSubmit() ||
        interaction.customId !==
            "modal_scouting"
    ) {

        return false;
    }

    const descricao =
        interaction.fields.getTextInputValue(
            "descricao"
        );

    const canal =
        interaction.guild.channels.cache.get(
            SCOUTING_CHANNEL_ID
        );

    if (!canal) {

        return interaction.reply({
            content:
                "❌ O canal de Scouting não foi encontrado.",

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
                "## 🔎 SCOUTING"
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
                        `${interaction.user}\n` +
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
    // BLOCO
    // ==================================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
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
                "-# VTL - SCOUTING"
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
            `✅ Seu jogador foi enviado para o Scouting em <#${SCOUTING_CHANNEL_ID}>.`,

        flags:
            MessageFlags.Ephemeral
    });
}

// ======================================================
// EXPORTS
// ======================================================

scoutingCommand.execute =
    executarScouting;

module.exports = {
    scoutingCommand,
    processarScouting
};