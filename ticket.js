
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
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ChannelType,
    PermissionFlagsBits
} = require("discord.js");

const path = require("path");
const config = require("./config");

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const TICKET_CATEGORY_ID = config.TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = config.STAFF_ROLE_ID;
const TICKET_PANEL_CHANNEL_ID = config.TICKET_PANEL_CHANNEL_ID;

// ======================================================
// IDS DOS TIPOS DE TICKET
// ======================================================

const TICKET_OWNAR = "cbda69e8d47d4bfacd52cc61947715da";
const TICKET_PARCERIA = "fe8064d9c3434287d0595be8a7375819";
const TICKET_OUTROS = "0bbd775bc3454cb48519ba583feef317";

// ======================================================
// IDS DOS BOTÕES
// ======================================================

const CLOSE_TICKET = "fechar_ticket";
const CONFIRM_CLOSE_TICKET = "confirmar_fechar_ticket";
const CANCEL_CLOSE_TICKET = "cancelar_fechar_ticket";
const TICKET_SELECT = "ticket_tipo_select";

// ======================================================
// RODAPÉ
// ======================================================

const TICKET_FOOTER = "-# PML • TICKET SYSTEM";

// ======================================================
// COMANDO /TICKET
// ======================================================

const ticketCommand = new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Envia o painel de atendimento de tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ======================================================
// PAINEL DO TICKET
// ======================================================

function criarPainelTicket() {
    const container = new ContainerBuilder();

    const topoPath = path.join(
        __dirname,
        "imagens",
        "ticket_topo.png"
    );

    const logoPath = path.join(
        __dirname,
        "imagens",
        "utl_logo.png"
    );

    // IMAGEM DO TOPO

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(
                new MediaGalleryItemBuilder()
                    .setURL("attachment://ticket_topo.png")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // TÍTULO E LOGO

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 🎫 Sistema de Tickets\n\n" +
                        "Selecione uma opção abaixo para entrar em contato com a equipe da PML."
                    )
            )
            .setThumbnailAccessory(
                new ThumbnailBuilder()
                    .setURL("attachment://utl_logo.png")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // EXPLICAÇÃO DAS OPÇÕES

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "⚽ **Ownar** — Solicite um time ou seleção.\n" +
                "🤝 **Parceria** — Envie uma proposta de parceria.\n" +
                "📩 **Outros** — Outros assuntos."
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // MENU DE SELEÇÃO

    const menu = new StringSelectMenuBuilder()
        .setCustomId(TICKET_SELECT)
        .setPlaceholder("Selecione o tipo de atendimento...")
        .addOptions(
            {
                label: "Ownar",
                description: "Solicitar um time ou seleção.",
                value: TICKET_OWNAR,
                emoji: "⚽"
            },
            {
                label: "Parceria",
                description: "Enviar uma proposta de parceria.",
                value: TICKET_PARCERIA,
                emoji: "🤝"
            },
            {
                label: "Outros",
                description: "Outros assuntos.",
                value: TICKET_OUTROS,
                emoji: "📩"
            }
        );

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(menu)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // RODAPÉ

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(TICKET_FOOTER)
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

function criarTicketContainer({ user, tipo, conteudo }) {
    const container = new ContainerBuilder();

    const ticketImagePath = path.join(
        __dirname,
        "imagens",
        "ticket_aberto_v2.png"
    );

    // IMAGEM

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(
                new MediaGalleryItemBuilder()
                    .setURL("attachment://ticket_aberto_v2.png")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // INFORMAÇÕES

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

    // ATENDIMENTO

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

    // BOTÃO FECHAR

    const closeButton = new ButtonBuilder()
        .setCustomId(CLOSE_TICKET)
        .setLabel("Fechar Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(closeButton)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(TICKET_FOOTER)
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
// CRIAR CANAL
// ======================================================

async function criarCanalTicket(interaction, tipo, conteudo) {
    const guild = interaction.guild;

    if (!guild) {
        return interaction.reply({
            content: "❌ Este sistema só pode ser usado dentro do servidor.",
            flags: MessageFlags.Ephemeral
        });
    }

    // VERIFICAR TICKET EXISTENTE

    const ticketExistente = guild.channels.cache.find(
        channel =>
            channel.parentId === TICKET_CATEGORY_ID &&
            channel.topic === `ticket:${interaction.user.id}`
    );

    if (ticketExistente) {
        return interaction.reply({
            content: `❌ Você já possui um ticket aberto: ${ticketExistente}`,
            flags: MessageFlags.Ephemeral
        });
    }

    // CRIAR CANAL

    const channel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 90),

        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,
        topic: `ticket:${interaction.user.id}`,

        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles
                ]
            },
            {
                id: STAFF_ROLE_ID,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles
                ]
            }
        ]
    });

    // CRIAR CONTAINER

    const ticket = criarTicketContainer({
        user: interaction.user,
        tipo,
        conteudo
    });

    // ENVIAR CONTAINER

    try {
        await channel.send({
            components: [ticket.container],
            files: ticket.files,
            flags: MessageFlags.IsComponentsV2
        });
    } catch (error) {
        console.error(
            "❌ Erro ao enviar painel do ticket:",
            error
        );

        await channel.delete().catch(() => {});

        return interaction.reply({
            content:
                "❌ Não foi possível configurar o ticket. Verifique as imagens e as permissões do bot.",
            flags: MessageFlags.Ephemeral
        });
    }

    // RESPOSTA

    return interaction.reply({
        content: `✅ Seu ticket foi criado: ${channel}`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// MODAL OWNAR
// ======================================================

function abrirModalOwnar(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_ticket_ownar")
        .setTitle("Ownar");

    const timeInput = new TextInputBuilder()
        .setCustomId("time")
        .setLabel("Qual time ou seleção você quer ownar?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const squadsheetInput = new TextInputBuilder()
        .setCustomId("squadsheet")
        .setLabel("Squadsheet")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(timeInput),
        new ActionRowBuilder().addComponents(squadsheetInput)
    );

    return interaction.showModal(modal);
}

// ======================================================
// MODAL PARCERIA
// ======================================================

function abrirModalParceria(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_ticket_parceria")
        .setTitle("Parceria");

    const texto = new TextInputBuilder()
        .setCustomId("texto_parceria")
        .setLabel("Texto da sua parceria")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(texto)
    );

    return interaction.showModal(modal);
}

// ======================================================
// MODAL OUTROS
// ======================================================

function abrirModalOutros(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_ticket_outros")
        .setTitle("Outros");

    const texto = new TextInputBuilder()
        .setCustomId("o_que_deseja")
        .setLabel("O que você deseja?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(texto)
    );

    return interaction.showModal(modal);
}

// ======================================================
// CONTAINER DE CONFIRMAÇÃO
// ======================================================

function criarContainerConfirmacao(user) {
    const confirmButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(CONFIRM_CLOSE_TICKET)
                .setLabel("Sim")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(CANCEL_CLOSE_TICKET)
                .setLabel("Não")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger)
        );

    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `⚠️ | ${user} Você tem certeza que deseja fechar esse ticket?`
                )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addActionRowComponents(confirmButtons)
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(TICKET_FOOTER)
        );
}

// ======================================================
// CONTAINER CANCELAMENTO
// ======================================================

function criarContainerCancelado() {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "⚠️ | Fechamento do ticket cancelado"
                )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(TICKET_FOOTER)
        );
}

// ======================================================
// VERIFICAR STAFF
// ======================================================

function isStaff(interaction) {
    if (!interaction.inGuild()) {
        return false;
    }

    const member = interaction.member;

    if (!member) {
        return false;
    }

    if (
        member.permissions?.has &&
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return true;
    }

    return Boolean(
        member.roles?.cache?.has(STAFF_ROLE_ID)
    );
}

// ======================================================
// INTERAÇÕES
// ======================================================

async function handleTicketInteraction(interaction) {

    // MENU DE SELEÇÃO

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId === TICKET_SELECT
    ) {
        const escolha = interaction.values[0];

        if (escolha === TICKET_OWNAR) {
            return abrirModalOwnar(interaction);
        }

        if (escolha === TICKET_PARCERIA) {
            return abrirModalParceria(interaction);
        }

        if (escolha === TICKET_OUTROS) {
            return abrirModalOutros(interaction);
        }

        return true;
    }

    // BOTÃO FECHAR — PEDIR CONFIRMAÇÃO

    if (
        interaction.isButton() &&
        interaction.customId === CLOSE_TICKET
    ) {
        if (!isStaff(interaction)) {
            return interaction.reply({
                components: [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    "❌ Apenas a equipe responsável pode fechar este ticket."
                                )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(TICKET_FOOTER)
                        )
                ],
                flags:
                    MessageFlags.IsComponentsV2 |
                    MessageFlags.Ephemeral
            });
        }

        return interaction.reply({
            components: [
                criarContainerConfirmacao(interaction.user)
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }

    // CONFIRMAR FECHAMENTO — CONTAGEM REGRESSIVA

    if (
        interaction.isButton() &&
        interaction.customId === CONFIRM_CLOSE_TICKET
    ) {
        if (!isStaff(interaction)) {
            return interaction.reply({
                content:
                    "❌ Apenas a equipe responsável pode fechar este ticket.",
                flags: MessageFlags.Ephemeral
            });
        }

        const channel = interaction.channel;

        if (!channel || !channel.deletable) {
            return interaction.reply({
                content:
                    "❌ Não consegui fechar este canal. Verifique as permissões do bot.",
                flags: MessageFlags.Ephemeral
            });
        }

        const criarContagem = numero =>
            new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `⚠️ | Fechando esse ticket em ${numero}...`
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(TICKET_FOOTER)
                );

        await interaction.update({
            components: [criarContagem(3)]
        });

        // CONTAGEM: 3 → 2 → 1

        for (const numero of [2, 1]) {
            await new Promise(resolve =>
                setTimeout(resolve, 1000)
            );

            await interaction.editReply({
                components: [criarContagem(numero)]
            });
        }

        // AGUARDAR MAIS UM SEGUNDO

        await new Promise(resolve =>
            setTimeout(resolve, 1000)
        );

        // EXCLUIR CANAL

        try {
            await channel.delete(
                "Ticket fechado pela equipe da PML"
            );
        } catch (error) {
            console.error(
                "❌ Erro ao fechar ticket:",
                error
            );
        }

        return true;
    }

    // CANCELAR FECHAMENTO

    if (
        interaction.isButton() &&
        interaction.customId === CANCEL_CLOSE_TICKET
    ) {
        if (!isStaff(interaction)) {
            return interaction.reply({
                content:
                    "❌ Apenas a equipe responsável pode cancelar o fechamento.",
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.update({
            components: [
                criarContainerCancelado()
            ]
        });

        return true;
    }

    // MODAL OWNAR

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_ticket_ownar"
    ) {
        const time =
            interaction.fields.getTextInputValue("time");

        const squadsheet =
            interaction.fields.getTextInputValue("squadsheet");

        const conteudo =
            "**Time/Seleção:**\n" +
            "```text\n" +
            time +
            "\n```\n\n" +
            "**Squadsheet:**\n" +
            "```text\n" +
            squadsheet +
            "\n```";

        return criarCanalTicket(
            interaction,
            "Ownar",
            conteudo
        );
    }

    // MODAL PARCERIA

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_ticket_parceria"
    ) {
        const texto =
            interaction.fields.getTextInputValue(
                "texto_parceria"
            );

        const conteudo =
            "**Proposta de parceria:**\n" +
            "```text\n" +
            texto +
            "\n```";

        return criarCanalTicket(
            interaction,
            "Parceria",
            conteudo
        );
    }

    // MODAL OUTROS

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_ticket_outros"
    ) {
        const texto =
            interaction.fields.getTextInputValue(
                "o_que_deseja"
            );

        const conteudo =
            "**Solicitação:**\n" +
            "```text\n" +
            texto +
            "\n```";

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

async function executarTicketCommand(interaction) {

    // VERIFICAR ADMINISTRADOR

    if (
        !interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return interaction.reply({
            content:
                "❌ Você precisa ter **Administrador** para usar este comando.",
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        // BUSCAR O CANAL CONFIGURADO PARA O PAINEL

        const canalPainel =
            await interaction.client.channels.fetch(
                TICKET_PANEL_CHANNEL_ID
            );

        if (
            !canalPainel ||
            !canalPainel.isTextBased() ||
            !canalPainel.guild
        ) {
            return interaction.reply({
                content:
                    "❌ Não foi possível encontrar o canal configurado para o painel de tickets.",
                flags: MessageFlags.Ephemeral
            });
        }

        // CRIAR PAINEL

        const painel = criarPainelTicket();

        // ENVIAR PAINEL NO CANAL CONFIGURADO

        await canalPainel.send({
            components: [
                painel.container
            ],
            files: painel.files,
            flags: MessageFlags.IsComponentsV2
        });

        // CONFIRMAR PARA O ADMINISTRADOR

        return interaction.reply({
            content:
                `✅ Painel de tickets enviado em <#${TICKET_PANEL_CHANNEL_ID}>.`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error(
            "❌ Erro ao enviar painel de tickets:",
            error
        );

        return interaction.reply({
            content:
                "❌ Não foi possível enviar o painel. Verifique se o bot tem permissão para ver e enviar mensagens no canal configurado.",
            flags: MessageFlags.Ephemeral
        });
    }
}

// ======================================================
// EXPORTS
// ======================================================

ticketCommand.execute = executarTicketCommand;

module.exports = {
    ticketCommand,
    handleTicketInteraction
};
