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
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const path = require("path");
const config = require("./config");

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const TICKET_CATEGORY_ID =
    config.TICKET_CATEGORY_ID;

const STAFF_ROLE_ID =
    config.STAFF_ROLE_ID;

const TICKET_PANEL_CHANNEL_ID =
    config.TICKET_PANEL_CHANNEL_ID;

// ======================================================
// IDS DOS TIPOS DE TICKET
// ======================================================

const TICKET_OWNAR =
    "cbda69e8d47d4bfacd52cc61947715da";

const TICKET_PARCERIA =
    "fe8064d9c3434287d0595be8a7375819";

const TICKET_DENUNCIA =
    "b270250acb7e4d07fcf7da4f4bff0024";

const TICKET_OUTROS =
    "0bbd775bc3454cb48519ba583feef317";

const CLOSE_TICKET =
    "fechar_ticket";

// ======================================================
// COMANDO /TICKET
// ======================================================

const ticketCommand =
    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Envia o painel de atendimento de tickets.")
        .setDefaultMemberPermissions("8");

// ======================================================
// PAINEL DE TICKETS
// ======================================================

function criarPainelTicket() {

    const container =
        new ContainerBuilder();

    // ==============================================
    // IMAGEM DO TOPO
    // ==============================================

    const topoPath =
        path.join(
            __dirname,
            "imagens",
            "ticket_topo.png"
        );

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(
                new MediaGalleryItemBuilder()
                    .setURL(
                        "attachment://ticket_topo.png"
                    )
            )
    );

    // ==============================================
    // TÍTULO + LOGO
    // ==============================================

    const logoPath =
        path.join(
            __dirname,
            "imagens",
            "utl_logo.png"
        );

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 🎫 Sistema de Tickets\n\n" +
                        "Selecione abaixo o tipo de atendimento que você deseja."
                    )
            )
            .setThumbnailAccessory(
                new ThumbnailBuilder()
                    .setURL(
                        "attachment://utl_logo.png"
                    )
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==============================================
    // BOTÕES
    // ==============================================

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        TICKET_OWNAR
                    )
                    .setLabel("Ownar")
                    .setEmoji("⚽")
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TICKET_PARCERIA
                    )
                    .setLabel("Parceria")
                    .setEmoji("🤝")
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TICKET_DENUNCIA
                    )
                    .setLabel("Denúncia")
                    .setEmoji("🚨")
                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TICKET_OUTROS
                    )
                    .setLabel("Outros")
                    .setEmoji("📩")
                    .setStyle(
                        ButtonStyle.Secondary
                    )

            )
    );

    // ==============================================
    // FOOTER
    // ==============================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "-# VTL - TICKET SYSTEM"
            )
    );

    return {
        container,

        files: [
            {
                attachment: topoPath,
                name: "ticket_topo.png"
            },
            {
                attachment: logoPath,
                name: "utl_logo.png"
            }
        ]
    };
}

// ======================================================
// CONTAINER DO TICKET ABERTO
// ======================================================

function criarTicketContainer({
    user,
    tipo,
    conteudo
}) {

    const container =
        new ContainerBuilder();

    // ==============================================
    // IMAGEM
    // ==============================================

    const ticketImagePath =
        path.join(
            __dirname,
            "imagens",
            "ticket_aberto_v2.png"
        );

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(
                new MediaGalleryItemBuilder()
                    .setURL(
                        "attachment://ticket_aberto_v2.png"
                    )
            )
    );

    // ==============================================
    // INFORMAÇÕES
    // ==============================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "## 🎫 TICKET ABERTO\n\n" +
                `**Usuário:** ${user}\n` +
                `**ID:** \`${user.id}\`\n\n` +
                `**Tipo:** ${tipo}`
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==============================================
    // ATENDIMENTO
    // ==============================================

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                `**Atendimento:** <@&${STAFF_ROLE_ID}>\n\n` +
                conteudo
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==============================================
    // BOTÃO FECHAR
    // ==============================================

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        CLOSE_TICKET
                    )
                    .setLabel("Fechar Ticket")
                    .setEmoji("🔒")
                    .setStyle(
                        ButtonStyle.Danger
                    )

            )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "-# VTL - TICKET SYSTEM"
            )
    );

    return {
        container,

        files: [
            {
                attachment: ticketImagePath,
                name: "ticket_aberto_v2.png"
            }
        ]
    };
}

// ======================================================
// CRIAR CANAL DO TICKET
// ======================================================

async function criarCanalTicket(
    interaction,
    tipo,
    conteudo
) {

    const guild =
        interaction.guild;

    if (!guild) {

        return interaction.reply({
            content:
                "❌ Este sistema só pode ser usado dentro do servidor.",
            flags: MessageFlags.Ephemeral
        });
    }

    // ==============================================
    // VERIFICAR TICKET EXISTENTE
    // ==============================================

    const ticketExistente =
        guild.channels.cache.find(
            channel =>
                channel.parentId ===
                    TICKET_CATEGORY_ID &&
                channel.topic ===
                    `ticket:${interaction.user.id}`
        );

    if (ticketExistente) {

        return interaction.reply({
            content:
                `❌ Você já possui um ticket aberto: ${ticketExistente}`,
            flags: MessageFlags.Ephemeral
        });
    }

    // ==============================================
    // CRIAR CANAL
    // ==============================================

    const channel =
        await guild.channels.create({

            name:
                `ticket-${interaction.user.username}`
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9-]/g,
                        ""
                    )
                    .slice(0, 90),

            type: 0,

            parent:
                TICKET_CATEGORY_ID,

            topic:
                `ticket:${interaction.user.id}`,

            permissionOverwrites: [

                {
                    id: guild.id,

                    deny: [
                        "ViewChannel"
                    ]
                },

                {
                    id: interaction.user.id,

                    allow: [
                        "ViewChannel",
                        "SendMessages",
                        "ReadMessageHistory",
                        "AttachFiles"
                    ]
                },

                {
                    id: STAFF_ROLE_ID,

                    allow: [
                        "ViewChannel",
                        "SendMessages",
                        "ReadMessageHistory",
                        "AttachFiles"
                    ]
                }

            ]
        });

    // ==============================================
    // CONTAINER
    // ==============================================

    const ticket =
        criarTicketContainer({
            user: interaction.user,
            tipo,
            conteudo
        });

    // ==============================================
    // ENVIAR TICKET
    // ==============================================

    await channel.send({

        components: [
            ticket.container
        ],

        files:
            ticket.files,

        flags:
            MessageFlags.IsComponentsV2

    });

    // ==============================================
    // RESPOSTA
    // ==============================================

    return interaction.reply({
        content:
            `✅ Seu ticket foi criado: ${channel}`,

        flags:
            MessageFlags.Ephemeral
    });
}

// ======================================================
// MODAL OWNAR
// ======================================================

function abrirModalOwnar(
    interaction
) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                "modal_ticket_ownar"
            )
            .setTitle("Ownar");

    const timeInput =
        new TextInputBuilder()
            .setCustomId("time")
            .setLabel(
                "Qual time ou seleção você quer ownar?"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMaxLength(100);

    const squadsheetInput =
        new TextInputBuilder()
            .setCustomId(
                "squadsheet"
            )
            .setLabel(
                "Squadsheet"
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(2000);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                timeInput
            ),

        new ActionRowBuilder()
            .addComponents(
                squadsheetInput
            )

    );

    return interaction.showModal(
        modal
    );
}

// ======================================================
// MODAL PARCERIA
// ======================================================

function abrirModalParceria(
    interaction
) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                "modal_ticket_parceria"
            )
            .setTitle(
                "Parceria"
            );

    const texto =
        new TextInputBuilder()
            .setCustomId(
                "texto_parceria"
            )
            .setLabel(
                "Texto da sua parceria"
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(2000);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                texto
            )

    );

    return interaction.showModal(
        modal
    );
}

// ======================================================
// MODAL OUTROS
// ======================================================

function abrirModalOutros(
    interaction
) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                "modal_ticket_outros"
            )
            .setTitle(
                "Outros"
            );

    const texto =
        new TextInputBuilder()
            .setCustomId(
                "o_que_deseja"
            )
            .setLabel(
                "O que você deseja?"
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(2000);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                texto
            )

    );

    return interaction.showModal(
        modal
    );
}

// ======================================================
// INTERAÇÕES
// ======================================================

async function handleTicketInteraction(
    interaction
) {

    // ==============================================
    // BOTÕES
    // ==============================================

    if (interaction.isButton()) {

        // ------------------------------------------
        // OWNAR
        // ------------------------------------------

        if (
            interaction.customId ===
            TICKET_OWNAR
        ) {

            return abrirModalOwnar(
                interaction
            );
        }

        // ------------------------------------------
        // PARCERIA
        // ------------------------------------------

        if (
            interaction.customId ===
            TICKET_PARCERIA
        ) {

            return abrirModalParceria(
                interaction
            );
        }

        // ------------------------------------------
        // DENÚNCIA
        // ------------------------------------------

        if (
            interaction.customId ===
            TICKET_DENUNCIA
        ) {

            return criarCanalTicket(

                interaction,

                "Denúncia",

                "Envie neste canal todas as informações e **anexe as imagens/provas necessárias**."

            );
        }

        // ------------------------------------------
        // OUTROS
        // ------------------------------------------

        if (
            interaction.customId ===
            TICKET_OUTROS
        ) {

            return abrirModalOutros(
                interaction
            );
        }

        // ------------------------------------------
        // FECHAR
        // ------------------------------------------

        if (
            interaction.customId ===
            CLOSE_TICKET
        ) {

            if (
                !interaction.member ||
                !interaction.member.roles.cache.has(
                    STAFF_ROLE_ID
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Apenas a equipe responsável pode fechar este ticket.",

                    flags:
                        MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                content:
                    "🔒 Fechando ticket...",

                flags:
                    MessageFlags.Ephemeral
            });

            setTimeout(
                async () => {

                    await interaction.channel
                        .delete()
                        .catch(
                            error => {

                                console.error(
                                    "❌ Erro ao fechar ticket:",
                                    error
                                );

                            }
                        );

                },
                1500
            );

            return true;
        }
    }

    // ==============================================
    // MODAL OWNAR
    // ==============================================

    if (
        interaction.isModalSubmit() &&
        interaction.customId ===
            "modal_ticket_ownar"
    ) {

        const time =
            interaction.fields
                .getTextInputValue(
                    "time"
                );

        const squadsheet =
            interaction.fields
                .getTextInputValue(
                    "squadsheet"
                );

        const conteudo =
            `**Time/Seleção:**\n` +
            `${time}\n\n` +
            `**Squadsheet:**\n` +
            `\`\`\`\n${squadsheet}\n\`\`\``;

        return criarCanalTicket(

            interaction,

            "Ownar",

            conteudo

        );
    }

    // ==============================================
    // MODAL PARCERIA
    // ==============================================

    if (
        interaction.isModalSubmit() &&
        interaction.customId ===
            "modal_ticket_parceria"
    ) {

        const texto =
            interaction.fields
                .getTextInputValue(
                    "texto_parceria"
                );

        const conteudo =
            `**Proposta de parceria:**\n` +
            `${texto}`;

        return criarCanalTicket(

            interaction,

            "Parceria",

            conteudo

        );
    }

    // ==============================================
    // MODAL OUTROS
    // ==============================================

    if (
        interaction.isModalSubmit() &&
        interaction.customId ===
            "modal_ticket_outros"
    ) {

        const texto =
            interaction.fields
                .getTextInputValue(
                    "o_que_deseja"
                );

        const conteudo =
            `**Solicitação:**\n` +
            `${texto}`;

        return criarCanalTicket(

            interaction,

            "Outros",

            conteudo

        );
    }

    return false;
}

// ======================================================
// EXECUTAR /TICKET
// ======================================================

async function executarTicketCommand(
    interaction
) {

    if (
        interaction.channelId !==
        TICKET_PANEL_CHANNEL_ID
    ) {

        return interaction.reply({
            content:
                `❌ O comando deve ser usado em <#${TICKET_PANEL_CHANNEL_ID}>.`,

            flags:
                MessageFlags.Ephemeral
        });
    }

    const painel =
        criarPainelTicket();

    return interaction.reply({

        components: [
            painel.container
        ],

        files:
            painel.files,

        flags:
            MessageFlags.IsComponentsV2

    });
}

// ======================================================
// EXPORTS
// ======================================================

ticketCommand.execute =
    executarTicketCommand;

module.exports = {
    ticketCommand,
    handleTicketInteraction
};