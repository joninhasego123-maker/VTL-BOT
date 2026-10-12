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

const MIN_MEMBERS = config.PARTNERSHIP_MIN_MEMBERS ?? 20;
const HERE_MIN_MEMBERS = config.PARTNERSHIP_HERE_MIN_MEMBERS ?? 30;
const EVERYONE_MIN_MEMBERS = config.PARTNERSHIP_EVERYONE_MIN_MEMBERS ?? 40;

const OFFICIAL_TEXT_CHANNEL_ID =
    config.PARTNERSHIP_OFFICIAL_TEXT_CHANNEL_ID ?? "1554483036337479762";

const SUBMISSION_CHANNEL_ID =
    config.PARTNERSHIP_SUBMISSION_CHANNEL_ID ?? "1554482952585355446";

const PARTNERSHIP_STAFF_ROLE_ID =
    config.PARTNERSHIP_STAFF_ROLE_ID ?? STAFF_ROLE_ID;

const PARTNERSHIP_INVITE_URL =
    config.PARTNERSHIP_INVITE_URL ?? "https://discord.gg/3pD35YudNh";

const SCREENSHOT_TIMEOUT =
    config.PARTNERSHIP_SCREENSHOT_TIMEOUT ?? 180000;

const TICKET_FOOTER = "-# PML • TICKET SYSTEM";
const PARTNERSHIP_FOOTER = "-# PML • PARCERIAS AUTOMÁTICAS";

const TICKET_OWNAR = "cbda69e8d47d4bfacd52cc61947715da";
const TICKET_PARCERIA = "fe8064d9c3434287d0595be8a7375819";
const TICKET_OUTROS = "0bbd775bc3454cb48519ba583feef317";

const CLOSE_TICKET = "fechar_ticket";
const CONFIRM_CLOSE_TICKET = "confirmar_fechar_ticket";
const CANCEL_CLOSE_TICKET = "cancelar_fechar_ticket";
const TICKET_SELECT = "ticket_tipo_select";

// Os estados ficam na memória. Reiniciar o bot limpa os processos ativos.
const partnershipStates = new Map();
const screenshotTimers = new Map();

const ticketCommand = new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Envia o painel de atendimento de tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function criarBotao(id, label, emoji, style) {
    return new ButtonBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setEmoji(emoji)
        .setStyle(style);
}

function containerTexto(texto, footer = TICKET_FOOTER) {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(texto)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(footer)
        );
}

function isStaff(interaction) {
    if (!interaction.inGuild() || !interaction.member) return false;

    if (
        interaction.member.permissions?.has?.(
            PermissionFlagsBits.Administrator
        )
    ) {
        return true;
    }

    return Boolean(
        interaction.member.roles?.cache?.has(STAFF_ROLE_ID)
    );
}

function isPartnershipStaff(interaction) {
    if (!interaction.inGuild() || !interaction.member) return false;

    if (
        interaction.member.permissions?.has?.(
            PermissionFlagsBits.Administrator
        )
    ) {
        return true;
    }

    return Boolean(
        interaction.member.roles?.cache?.has(
            PARTNERSHIP_STAFF_ROLE_ID
        )
    );
}

function limparTimer(channelId) {
    const timer = screenshotTimers.get(channelId);

    if (timer) clearTimeout(timer);

    screenshotTimers.delete(channelId);
}

function limparEstado(channelId) {
    limparTimer(channelId);
    partnershipStates.delete(channelId);
}

function nomeCanal(username) {
    return (
        "ticket-" +
        username
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 85)
    );
}

// ======================================================
// PAINEL /TICKET
// ======================================================

function criarPainelTicket() {
    const container = new ContainerBuilder();

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
                .setURL("attachment://ticket_topo.png")
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "## 🎫 Sistema de Tickets\n\n" +
                    "Selecione uma opção abaixo para entrar em contato com a equipe da PML."
                )
            )
            .setThumbnailAccessory(
                new ThumbnailBuilder()
                    .setURL("attachment://utl_logo.png")
            )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "⚽ **Ownar** — Solicite um time ou seleção.\n" +
            "🤝 **Parceria** — Inicie uma parceria com a PML.\n" +
            "📩 **Outros** — Outros assuntos."
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
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
                        description: "Iniciar uma parceria com a PML.",
                        value: TICKET_PARCERIA,
                        emoji: "🤝"
                    },
                    {
                        label: "Outros",
                        description: "Outros assuntos.",
                        value: TICKET_OUTROS,
                        emoji: "📩"
                    }
                )
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(TICKET_FOOTER)
    );

    return {
        container,
        files: [
            {
                attachment: path.join(
                    __dirname,
                    "imagens",
                    "ticket_topo.png"
                ),
                name: "ticket_topo.png"
            },
            {
                attachment: path.join(
                    __dirname,
                    "imagens",
                    "utl_logo.png"
                ),
                name: "utl_logo.png"
            }
        ]
    };
}

// ======================================================
// TICKET NORMAL: OWNAR E OUTROS
// ======================================================

function criarTicketContainer({ user, tipo, conteudo }) {
    const container = new ContainerBuilder();

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
                .setURL("attachment://ticket_aberto_v2.png")
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "## 🎫 TICKET ABERTO\n\n" +
            `**Usuário:** ${user}\n` +
            `**ID:** \`${user.id}\`\n\n` +
            `**Tipo:** ${tipo}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Atendimento:** <@&${STAFF_ROLE_ID}>\n\n${conteudo}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            criarBotao(
                CLOSE_TICKET,
                "Fechar Ticket",
                "🔒",
                ButtonStyle.Danger
            )
        )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(TICKET_FOOTER)
    );

    return container;
}

async function criarCanalTicket(interaction, tipo, conteudo) {
    const guild = interaction.guild;

    if (!guild) {
        return interaction.reply({
            content: "❌ Este sistema só pode ser usado dentro do servidor.",
            flags: MessageFlags.Ephemeral
        });
    }

    const existente = guild.channels.cache.find(
        channel =>
            channel.parentId === TICKET_CATEGORY_ID &&
            channel.topic?.startsWith(`ticket:${interaction.user.id}`)
    );

    if (existente) {
        return interaction.reply({
            content: `❌ Você já possui um ticket aberto: ${existente}`,
            flags: MessageFlags.Ephemeral
        });
    }

    const channel = await guild.channels.create({
        name: nomeCanal(interaction.user.username),
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

    try {
        await channel.send({
            components: [
                criarTicketContainer({
                    user: interaction.user,
                    tipo,
                    conteudo
                })
            ],
            files: [
                {
                    attachment: path.join(
                        __dirname,
                        "imagens",
                        "ticket_aberto_v2.png"
                    ),
                    name: "ticket_aberto_v2.png"
                }
            ],
            flags: MessageFlags.IsComponentsV2
        });
    } catch (error) {
        console.error("Erro ao criar ticket:", error);

        await channel.delete().catch(() => {});

        return interaction.reply({
            content: "❌ Não consegui configurar o ticket. Verifique as permissões e as imagens.",
            flags: MessageFlags.Ephemeral
        });
    }

    return interaction.reply({
        content: `✅ Seu ticket foi criado: ${channel}`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// MODAIS NORMAIS
// ======================================================

function abrirModalOwnar(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_ticket_ownar")
        .setTitle("Ownar");

    const time = new TextInputBuilder()
        .setCustomId("time")
        .setLabel("Qual time ou seleção você quer ownar?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const squadsheet = new TextInputBuilder()
        .setCustomId("squadsheet")
        .setLabel("Squadsheet")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(time),
        new ActionRowBuilder().addComponents(squadsheet)
    );

    return interaction.showModal(modal);
}

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
// PARCERIA: CONTAINERS
// ======================================================

function containerConfirmarAbertura(userId) {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `⚠️ | Ei <@${userId}>, tem certeza que deseja abrir esse ticket?`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                criarBotao(
                    `partner_open_yes:${userId}`,
                    "Sim",
                    "✅",
                    ButtonStyle.Success
                ),
                criarBotao(
                    `partner_open_no:${userId}`,
                    "Não",
                    "❌",
                    ButtonStyle.Danger
                )
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(TICKET_FOOTER)
        );
}

function containerInicioParceria(userId) {
    const container = new ContainerBuilder();

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder()
                .setURL("attachment://ticket_aberto_v2.png")
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "## 🤝 PML • Começar uma parceria\n\n" +
            `Bem-vindo ao ticket de parceria, <@${userId}>.\n\n` +
            "Aqui você consegue iniciar uma parceria com a PML de forma organizada e automática. " +
            "Envie as informações quando o bot pedir e aguarde a análise.\n\n" +
            "**Atenção:** servidores com NSFW, golpes, racismo e conteúdo ilegal serão recusados e poderão ser colocados na blacklist da liga."
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            criarBotao(
                `partner_start:${userId}`,
                "Iniciar",
                "✅",
                ButtonStyle.Success
            ),
            criarBotao(
                `partner_cancel:${userId}`,
                "Cancelar",
                "❌",
                ButtonStyle.Danger
            )
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(PARTNERSHIP_FOOTER)
    );

    return container;
}

function containerRequisitos() {
    return containerTexto(
        "**Mande o link de convite permanente da sua liga abaixo.**\n\n" +
        "**Requisitos**\n\n" +
        `> Sem ping: ${MIN_MEMBERS} membros\n` +
        `> Here: ${HERE_MIN_MEMBERS} membros\n` +
        `> Everyone: ${EVERYONE_MIN_MEMBERS} membros`,
        PARTNERSHIP_FOOTER
    );
}

function containerMembrosInsuficientes(total) {
    return containerTexto(
        `⚠️ | Seu servidor precisa ter **${MIN_MEMBERS} membros ou mais** para fechar parceria. Detectei: **${total} membros**.`,
        PARTNERSHIP_FOOTER
    );
}

function containerConfirmarCancelamento(userId) {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `⚠️ | Ei <@${userId}>, tem certeza que deseja cancelar a parceria com a PML?`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                criarBotao(
                    `partner_cancel_yes:${userId}`,
                    "Sim",
                    "✅",
                    ButtonStyle.Success
                ),
                criarBotao(
                    `partner_cancel_no:${userId}`,
                    "Não",
                    "❌",
                    ButtonStyle.Danger
                )
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(PARTNERSHIP_FOOTER)
        );
}

function containerProximoPasso(estado) {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "## 📋 Próximo passo: Envie nosso texto de parceria\n\n" +
                `> ✅ Servidor detectado: **${estado.guildName}**\n` +
                `> ✅ Membros detectados: **${estado.memberCount}**\n` +
                `> ✅ Ativos detectados: **${estado.activeCount ?? "Não disponível"}**\n\n` +
                `1. Envie o texto oficial da PML que está em <#${OFFICIAL_TEXT_CHANNEL_ID}> no **seu servidor**.\n` +
                "2. Certifique-se de que o texto esteja visível para todos os membros.\n" +
                "3. Após enviar, clique no botão abaixo para confirmar."
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                criarBotao(
                    "partner_confirm_text",
                    "Confirmar envio do texto",
                    "✅",
                    ButtonStyle.Success
                )
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(PARTNERSHIP_FOOTER)
        );
}

function containerPedidoPrint() {
    return containerTexto(
        "📸 **Por favor, envie uma print mostrando que você enviou nosso texto de parceria no seu servidor.**\n\n" +
        "• A print deve mostrar claramente o **texto oficial da PML** enviado.\n" +
        "• Certifique-se de que **TODO** o texto da PML esteja visível.\n" +
        "• O bot reprova prints que não mostrem o texto oficial; a análise automática pode falhar.\n" +
        "• Você tem **3 minutos** para enviar.\n\n" +
        "🚨 **Aviso:** enviar prints falsas ou repetidas repetidamente pode resultar em banimento.",
        PARTNERSHIP_FOOTER
    );
}

function containerPrintReprovada() {
    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "❌ **A print não foi aprovada pelo BOT!**\n\n" +
                "**Motivo:** Não foi possível confirmar todo o texto na print.\n\n" +
                "Por favor, envie uma print que mostre claramente:\n\n" +
                "1. O servidor correto;\n" +
                "2. A divulgação/convite da PML publicada dentro dele.\n\n" +
                "💡 **Dica:** não vale mandar convite de um servidor e print de outro. " +
                "O texto oficial ou o convite da PML precisa aparecer no servidor correto.\n\n" +
                "🚨 **Aviso:** enviar prints falsas ou repetidas repetidamente pode resultar em banimento."
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                criarBotao(
                    "partner_manual_approve",
                    "Confirmar Manualmente (staff)",
                    "✅",
                    ButtonStyle.Secondary
                )
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Cargo da staff: <@&${PARTNERSHIP_STAFF_ROLE_ID}>`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(PARTNERSHIP_FOOTER)
        );

    return container;
}

function containerUltimoPasso() {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "Clique no botão abaixo e escreva seu texto de parceria. " +
                `Nosso bot irá analisar sua solicitação e mandar seu texto em <#${SUBMISSION_CHANNEL_ID}> assim que possível.`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                criarBotao(
                    "partner_submit_text",
                    "Mandar o texto",
                    "✅",
                    ButtonStyle.Success
                )
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(PARTNERSHIP_FOOTER)
        );
}

// ======================================================
// CONVITE DO DISCORD
// ======================================================

function extrairCodigoConvite(texto) {
    const match = texto.match(
        /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)/i
    );

    return match ? match[1] : null;
}

async function verificarConvite(message, estado) {
    const codigo = extrairCodigoConvite(message.content);

    if (!codigo) {
        await message.reply({
            components: [
                containerTexto(
                    "❌ Envie um link de convite do Discord válido e permanente.",
                    PARTNERSHIP_FOOTER
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        return;
    }

    let invite;

    try {
        invite = await message.client.fetchInvite(codigo, {
            withCounts: true
        });
    } catch (error) {
        await message.reply({
            components: [
                containerTexto(
                    "❌ Não consegui verificar esse convite. Confira se ele está válido e tente novamente.",
                    PARTNERSHIP_FOOTER
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        return;
    }

    if (invite.maxAge !== 0 || invite.maxUses !== 0) {
        await message.reply({
            components: [
                containerTexto(
                    "❌ O convite precisa ser permanente, sem limite de tempo e sem limite de usos. Crie outro convite e envie novamente.",
                    PARTNERSHIP_FOOTER
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        return;
    }

    const membros = invite.approximateMemberCount;

    if (typeof membros !== "number") {
        await message.reply({
            components: [
                containerTexto(
                    "⚠️ O Discord não forneceu a quantidade de membros desse servidor. Tente outro convite ou solicite análise da staff.",
                    PARTNERSHIP_FOOTER
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        return;
    }

    const ativos = invite.approximatePresenceCount;
    const nome = invite.guild?.name ?? "Servidor não identificado";

    if (membros < MIN_MEMBERS) {
        await message.reply({
            components: [containerMembrosInsuficientes(membros)],
            flags: MessageFlags.IsComponentsV2
        });

        return;
    }

    estado.inviteCode = codigo;
    estado.inviteUrl = `https://discord.gg/${codigo}`;
    estado.guildName = nome;
    estado.memberCount = membros;
    estado.activeCount = typeof ativos === "number" ? ativos : null;
    estado.stage = "waiting_screenshot_confirmation";

    await message.reply({
        components: [containerProximoPasso(estado)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {
            parse: []
        }
    });
}

// ======================================================
// ANÁLISE BÁSICA DE PRINT
// OCR OPCIONAL: npm install tesseract.js
// ======================================================

async function analisarPrint(attachment) {
    const nomeArquivo = attachment.name ?? attachment.url ?? "";

    const ehImagem =
        attachment.contentType?.startsWith("image/") ||
        /\.(png|jpe?g|webp|bmp|gif)$/i.test(nomeArquivo);

    if (!ehImagem) {
        return false;
    }

    let tesseract;

    try {
        tesseract = require("tesseract.js");
    } catch {
        // Sem OCR, a print fica para avaliação manual.
        return false;
    }

    try {
        const resultado = await tesseract.recognize(
            attachment.url,
            "por+eng"
        );

        const texto = resultado.data.text
            .toLowerCase()
            .replace(/\s+/g, " ");

        const temNomePML =
            texto.includes("pro mps league") ||
            texto.includes("pml");

        const temTextoDaDivulgacao =
            texto.includes("bots próprios") ||
            texto.includes("bots proprios") ||
            texto.includes("staff ativa") ||
            texto.includes("campeonatos") ||
            texto.includes("discord.gg");

        // É uma verificação simples de texto, não uma prova
        // de autenticidade nem de que a imagem não foi editada.
        return temNomePML && temTextoDaDivulgacao;
    } catch (error) {
        console.error("Erro na leitura da print:", error);
        return false;
    }
}

// ======================================================
// MODAL FINAL DA PARCERIA
// ======================================================

function abrirModalTextoParceria(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_partner_final_text")
        .setTitle("Envie o texto da sua parceria");

    const texto = new TextInputBuilder()
        .setCustomId("texto_parceria_final")
        .setLabel("Envie o texto da sua parceria")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(texto)
    );

    return interaction.showModal(modal);
}

function filtrarPings(texto, estado) {
    let resultado = texto;

    if ((estado.memberCount ?? 0) < HERE_MIN_MEMBERS) {
        resultado = resultado
            .replace(/@here/gi, "here")
            .replace(/<@here>/gi, "here");
    }

    if ((estado.memberCount ?? 0) < EVERYONE_MIN_MEMBERS) {
        resultado = resultado
            .replace(/@everyone/gi, "everyone")
            .replace(/<@everyone>/gi, "everyone");
    }

    return resultado;
}

// ======================================================
// INTERAÇÕES DO PROCESSO DE PARCERIA
// ======================================================

async function handlePartnershipInteraction(interaction) {
    const id = interaction.customId;

    // CONFIRMAR ABERTURA
    if (id.startsWith("partner_open_yes:")) {
        const userId = id.split(":")[1];

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: "❌ Essa confirmação pertence a outra pessoa.",
                flags: MessageFlags.Ephemeral
            });
        }

        const existente = interaction.guild.channels.cache.find(
            channel =>
                channel.parentId === TICKET_CATEGORY_ID &&
                channel.topic?.startsWith(`ticket:${userId}`)
        );

        if (existente) {
            return interaction.update({
                content: `❌ Você já possui um ticket aberto: ${existente}`,
                components: []
            });
        }

        await interaction.update({
            content: "⏳ Criando seu ticket de parceria...",
            components: []
        });

        try {
            const guild = interaction.guild;

            const channel = await guild.channels.create({
                name: nomeCanal(interaction.user.username),
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
                topic: `ticket:${userId}:parceria`,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: userId,
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

            partnershipStates.set(channel.id, {
                ownerId: userId,
                guildId: guild.id,
                stage: "waiting_start"
            });

            await channel.send({
                components: [
                    containerInicioParceria(userId)
                ],
                files: [
                    {
                        attachment: path.join(
                            __dirname,
                            "imagens",
                            "ticket_aberto_v2.png"
                        ),
                        name: "ticket_aberto_v2.png"
                    }
                ],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: {
                    parse: []
                }
            });

            return interaction.editReply({
                content: `✅ Seu ticket de parceria foi criado: ${channel}`,
                components: []
            });
        } catch (error) {
            console.error("Erro ao criar ticket de parceria:", error);

            return interaction.editReply({
                content: "❌ Não consegui criar o ticket. Verifique as permissões do bot e a categoria.",
                components: []
            });
        }
    }

    // CANCELAR ABERTURA
    if (id.startsWith("partner_open_no:")) {
        const userId = id.split(":")[1];

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: "❌ Essa confirmação pertence a outra pessoa.",
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.update({
            content: "❎ A abertura do ticket foi cancelada.",
            components: []
        });
    }

    // MOSTRAR CONFIRMAÇÃO DE CANCELAMENTO
    if (id.startsWith("partner_cancel:")) {
        const userId = id.split(":")[1];

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: "❌ Só quem abriu o ticket pode cancelar a parceria.",
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.reply({
            components: [
                containerConfirmarCancelamento(userId)
            ],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
    }

    // CONFIRMAR CANCELAMENTO
    if (id.startsWith("partner_cancel_yes:")) {
        const userId = id.split(":")[1];

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: "❌ Essa confirmação pertence a outra pessoa.",
                flags: MessageFlags.Ephemeral
            });
        }

        limparEstado(interaction.channelId);

        await interaction.reply({
            content: "❎ Parceria cancelada. O ticket será fechado.",
            flags: MessageFlags.Ephemeral
        });

        await interaction.channel.delete(
            "Parceria cancelada pelo usuário"
        ).catch(console.error);

        return true;
    }

    // NÃO CANCELAR
    if (id.startsWith("partner_cancel_no:")) {
        const userId = id.split(":")[1];

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: "❌ Essa confirmação pertence a outra pessoa.",
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.update({
            content: "✅ Você pode continuar com a parceria.",
            components: []
        });
    }

    // INICIAR FLUXO
    if (id.startsWith("partner_start:")) {
        const userId = id.split(":")[1];
        const estado = partnershipStates.get(interaction.channelId);

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: "❌ Só quem abriu o ticket pode iniciar o processo.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!estado) {
            return interaction.reply({
                content: "❌ O processo não está ativo. Abra outro ticket.",
                flags: MessageFlags.Ephemeral
            });
        }

        estado.stage = "waiting_invite";

        return interaction.reply({
            components: [containerRequisitos()],
            flags: MessageFlags.IsComponentsV2
        });
    }

    // CONFIRMAR ENVIO DO TEXTO
    if (id === "partner_confirm_text") {
        const estado = partnershipStates.get(interaction.channelId);

        if (!estado || interaction.user.id !== estado.ownerId) {
            return interaction.reply({
                content: "❌ Apenas quem abriu o ticket pode confirmar.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (estado.stage !== "waiting_screenshot_confirmation") {
            return interaction.reply({
                content: "❌ Primeiro envie e valide o convite permanente do seu servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        estado.stage = "waiting_screenshot";

        await interaction.reply({
            components: [containerPedidoPrint()],
            flags: MessageFlags.IsComponentsV2
        });

        limparTimer(interaction.channelId);

        const timer = setTimeout(async () => {
            const atual = partnershipStates.get(interaction.channelId);

            if (atual?.stage !== "waiting_screenshot") return;

            atual.stage = "screenshot_timeout";

            const channel = await interaction.client.channels
                .fetch(interaction.channelId)
                .catch(() => null);

            if (channel?.isTextBased()) {
                await channel.send({
                    components: [
                        containerTexto(
                            "⏰ O prazo de 3 minutos acabou. Peça ajuda à staff para continuar a solicitação.",
                            PARTNERSHIP_FOOTER
                        )
                    ],
                    flags: MessageFlags.IsComponentsV2
                }).catch(() => {});
            }

            screenshotTimers.delete(interaction.channelId);
        }, SCREENSHOT_TIMEOUT);

        screenshotTimers.set(interaction.channelId, timer);

        return true;
    }

    // APROVAÇÃO MANUAL DA PRINT
    if (id === "partner_manual_approve") {
        if (!isPartnershipStaff(interaction)) {
            return interaction.reply({
                content: "❌ Apenas a staff autorizada pode aprovar manualmente.",
                flags: MessageFlags.Ephemeral
            });
        }

        const estado = partnershipStates.get(interaction.channelId);

        if (!estado) {
            return interaction.reply({
                content: "❌ Não encontrei o processo desta parceria.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (estado.stage !== "waiting_manual_review") {
            return interaction.reply({
                content: "❌ Esta solicitação não está aguardando aprovação manual da print.",
                flags: MessageFlags.Ephemeral
            });
        }

        limparTimer(interaction.channelId);
        estado.stage = "waiting_final_text";

        await interaction.reply({
            content: `✅ Print aprovada manualmente por ${interaction.user}.`,
            allowedMentions: {
                parse: []
            }
        });

        await interaction.channel.send({
            components: [containerUltimoPasso()],
            flags: MessageFlags.IsComponentsV2
        });

        return true;
    }

    // BOTÃO DO TEXTO FINAL
    if (id === "partner_submit_text") {
        const estado = partnershipStates.get(interaction.channelId);

        if (!estado || interaction.user.id !== estado.ownerId) {
            return interaction.reply({
                content: "❌ Apenas quem abriu o ticket pode enviar o texto.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (estado.stage !== "waiting_final_text") {
            return interaction.reply({
                content: "❌ A etapa de envio do texto ainda não foi liberada.",
                flags: MessageFlags.Ephemeral
            });
        }

        return abrirModalTextoParceria(interaction);
    }

    return false;
}

// ======================================================
// INTERAÇÕES PRINCIPAIS
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
            return interaction.reply({
                components: [
                    containerConfirmarAbertura(interaction.user.id)
                ],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
        }

        if (escolha === TICKET_OUTROS) {
            return abrirModalOutros(interaction);
        }

        return false;
    }

    // BOTÕES DE PARCERIA
    if (
        interaction.isButton() &&
        (
            interaction.customId.startsWith("partner_") ||
            interaction.customId === "partner_confirm_text" ||
            interaction.customId === "partner_manual_approve" ||
            interaction.customId === "partner_submit_text"
        )
    ) {
        return handlePartnershipInteraction(interaction);
    }

    // FECHAR TICKET: PEDIR CONFIRMAÇÃO
    if (
        interaction.isButton() &&
        interaction.customId === CLOSE_TICKET
    ) {
        if (!isStaff(interaction)) {
            return interaction.reply({
                components: [
                    containerTexto(
                        "❌ Apenas a equipe responsável pode fechar este ticket."
                    )
                ],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
        }

        const confirmacao = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `⚠️ | ${interaction.user} Você tem certeza que deseja fechar esse ticket?`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    criarBotao(
                        CONFIRM_CLOSE_TICKET,
                        "Sim",
                        "✅",
                        ButtonStyle.Success
                    ),
                    criarBotao(
                        CANCEL_CLOSE_TICKET,
                        "Não",
                        "❌",
                        ButtonStyle.Danger
                    )
                )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(TICKET_FOOTER)
            );

        return interaction.reply({
            components: [confirmacao],
            flags: MessageFlags.IsComponentsV2
        });
    }

    // CONFIRMAR FECHAMENTO
    if (
        interaction.isButton() &&
        interaction.customId === CONFIRM_CLOSE_TICKET
    ) {
        if (!isStaff(interaction)) {
            return interaction.reply({
                content: "❌ Apenas a equipe responsável pode fechar este ticket.",
                flags: MessageFlags.Ephemeral
            });
        }

        const channel = interaction.channel;

        if (!channel?.deletable) {
            return interaction.reply({
                content: "❌ Não consegui fechar este canal.",
                flags: MessageFlags.Ephemeral
            });
        }

        const contagem = numero =>
            containerTexto(
                `⚠️ | Fechando esse ticket em ${numero}...`
            );

        await interaction.update({
            components: [contagem(3)]
        });

        for (const numero of [2, 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            await interaction.editReply({
                components: [contagem(numero)]
            });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        limparEstado(channel.id);

        await channel.delete(
            "Ticket fechado pela equipe da PML"
        ).catch(console.error);

        return true;
    }

    // CANCELAR FECHAMENTO NORMAL
    if (
        interaction.isButton() &&
        interaction.customId === CANCEL_CLOSE_TICKET
    ) {
        if (!isStaff(interaction)) {
            return interaction.reply({
                content: "❌ Apenas a equipe responsável pode cancelar o fechamento.",
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.update({
            components: [
                containerTexto("⚠️ | Fechamento do ticket cancelado")
            ]
        });
    }

    // MODAL OWNAR
    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_ticket_ownar"
    ) {
        const time = interaction.fields.getTextInputValue("time");
        const squadsheet = interaction.fields.getTextInputValue("squadsheet");

        const conteudo =
            "**Time/Seleção:**\n```text\n" + time + "\n```\n\n" +
            "**Squadsheet:**\n```text\n" + squadsheet + "\n```";

        return criarCanalTicket(interaction, "Ownar", conteudo);
    }

    // MODAL OUTROS
    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_ticket_outros"
    ) {
        const texto = interaction.fields.getTextInputValue("o_que_deseja");

        return criarCanalTicket(
            interaction,
            "Outros",
            "**Solicitação:**\n```text\n" + texto + "\n```"
        );
    }

    // MODAL FINAL DA PARCERIA
    if (
        interaction.isModalSubmit() &&
        interaction.customId === "modal_partner_final_text"
    ) {
        const estado = partnershipStates.get(interaction.channelId);

        if (!estado || interaction.user.id !== estado.ownerId) {
            return interaction.reply({
                content: "❌ Não encontrei uma solicitação de parceria válida para você.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (estado.stage !== "waiting_final_text") {
            return interaction.reply({
                content: "❌ A sua solicitação ainda não chegou à etapa de envio do texto.",
                flags: MessageFlags.Ephemeral
            });
        }

        const textoOriginal =
            interaction.fields.getTextInputValue("texto_parceria_final");

        const textoFinal = filtrarPings(textoOriginal, estado);

        if (!textoFinal.trim()) {
            return interaction.reply({
                content: "❌ O texto da parceria não pode estar vazio.",
                flags: MessageFlags.Ephemeral
            });
        }

        const canalDestino = await interaction.client.channels
            .fetch(SUBMISSION_CHANNEL_ID)
            .catch(() => null);

        if (!canalDestino?.isTextBased()) {
            return interaction.reply({
                content: "❌ Não encontrei o canal de envio de parcerias. Avise a staff.",
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        try {
            await canalDestino.send({
                content: textoFinal,
                allowedMentions: {
                    // O Discord trata @everyone e @here na mesma
                    // opção. O filtrarPings remove cada um
                    // separadamente conforme o limite de membros.
                    parse: [
                        ...(estado.memberCount >= HERE_MIN_MEMBERS
                            ? ["everyone"]
                            : [])
                    ]
                }
            });

            await interaction.editReply({
                content: "✅ Seu texto foi enviado para análise! O ticket será fechado."
            });

            limparEstado(interaction.channelId);

            await interaction.channel.delete(
                "Texto de parceria enviado para análise"
            );
        } catch (error) {
            console.error("Erro ao enviar texto de parceria:", error);

            await interaction.editReply({
                content: "❌ Não consegui enviar seu texto. Verifique as permissões do bot no canal de parcerias."
            });
        }

        return true;
    }

    return false;
}

// ======================================================
// EVENTO DE MENSAGENS DA PARCERIA
// O index.js precisa chamar esta função em messageCreate.
// ======================================================

async function handleTicketMessage(message) {
    if (!message.guild || message.author.bot) return false;

    const estado = partnershipStates.get(message.channel.id);

    if (!estado) return false;

    if (message.author.id !== estado.ownerId) return true;

    // RECEBER LINK DE CONVITE
    if (estado.stage === "waiting_invite") {
        await verificarConvite(message, estado);
        return true;
    }

    // RECEBER PRINT
    if (estado.stage === "waiting_screenshot") {
        const imagem = message.attachments.find(attachment => {
            const nomeArquivo = attachment.name ?? attachment.url ?? "";

            return (
                attachment.contentType?.startsWith("image/") ||
                /\.(png|jpe?g|webp|bmp|gif)$/i.test(nomeArquivo)
            );
        });

        if (!imagem) {
            await message.reply({
                components: [
                    containerTexto(
                        "❌ Envie a print como imagem anexada. Você ainda tem até o fim do prazo para enviar.",
                        PARTNERSHIP_FOOTER
                    )
                ],
                flags: MessageFlags.IsComponentsV2
            });

            return true;
        }

        limparTimer(message.channel.id);

        const aprovada = await analisarPrint(imagem);

        if (aprovada) {
            estado.stage = "waiting_final_text";

            await message.reply({
                components: [containerUltimoPasso()],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            estado.stage = "waiting_manual_review";

            await message.reply({
                components: [containerPrintReprovada()],
                flags: MessageFlags.IsComponentsV2
            });
        }

        return true;
    }

    // PRAZO DA PRINT ENCERRADO
    if (estado.stage === "screenshot_timeout") {
        await message.reply({
            components: [
                containerTexto(
                    "⏰ O prazo para envio da print terminou. Peça ajuda à staff para continuar.",
                    PARTNERSHIP_FOOTER
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        return true;
    }

    return false;
}

// ======================================================
// EXECUTAR /TICKET
// ======================================================

async function executarTicketCommand(interaction) {
    if (
        !interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return interaction.reply({
            content: "❌ Você precisa ter **Administrador** para usar este comando.",
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        const canalPainel = await interaction.client.channels.fetch(
            TICKET_PANEL_CHANNEL_ID
        );

        if (
            !canalPainel ||
            !canalPainel.isTextBased() ||
            !canalPainel.guild
        ) {
            return interaction.reply({
                content: "❌ Não encontrei o canal configurado para o painel.",
                flags: MessageFlags.Ephemeral
            });
        }

        const painel = criarPainelTicket();

        await canalPainel.send({
            components: [painel.container],
            files: painel.files,
            flags: MessageFlags.IsComponentsV2
        });

        return interaction.reply({
            content: `✅ Painel de tickets enviado em <#${TICKET_PANEL_CHANNEL_ID}>.`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.error("Erro ao enviar painel:", error);

        return interaction.reply({
            content: "❌ Não consegui enviar o painel. Verifique as permissões e os IDs configurados.",
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
    handleTicketInteraction,
    handleTicketMessage
};