
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags
} = require("discord.js");

const http = require("http");
const config = require("./config");

// ======================================================
// TICKET
// ======================================================

const {
    ticketCommand,
    handleTicketInteraction,
    handleTicketMessage
} = require("./ticket");

// ======================================================
// CONTRACT
// ======================================================

const {
    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand,
    criarTimeCommand,
    excluirTimeCommand,
    autoreleaseCommand,
    executarComando,
    processarBotaoContrato
} = require("./contract");

// ======================================================
// FREE AGENCY
// ======================================================

const {
    freeagencyCommand,
    processarFreeAgency
} = require("./freeagency");

// ======================================================
// SCOUTING
// ======================================================

const {
    scoutingCommand,
    processarScouting
} = require("./scouting");

// ======================================================
// RULES
// ======================================================

const {
    rulesCommand,
    processarRules
} = require("./rules");

// ======================================================
// SHOUTS
// ======================================================

const {
    shoutsCommand,
    executarShouts,
    processarShouts
} = require("./shouts");

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const WELCOME_CHANNEL_ID = "1552633149123596308";

const WELCOME_IMAGE_URL =
    "https://plain-enam-prod-public.komododecks.com/202609/29/F3Bzfcvoph52mKCch3Wi/image.png";

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// ======================================================
// COMANDOS
// ======================================================

const commands = [
    ticketCommand,
    freeagencyCommand,
    scoutingCommand,
    rulesCommand,
    shoutsCommand,

    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand,
    criarTimeCommand,
    excluirTimeCommand,
    autoreleaseCommand
].map(command => command.toJSON());

// ======================================================
// SERVIDOR HTTP - RENDER
// ======================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("PML Bot online!");
});

server.listen(PORT, () => {
    console.log(`🌐 Servidor HTTP online na porta ${PORT}`);
});

// ======================================================
// REGISTRAR SLASH COMMANDS
// ======================================================

async function registrarComandos() {
    try {
        const rest = new REST({ version: "10" })
            .setToken(config.TOKEN);

        console.log("🔄 Registrando comandos...");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log(
            `✅ ${commands.length} comandos registrados com sucesso.`
        );
    } catch (error) {
        console.error(
            "❌ Erro ao registrar comandos:",
            error
        );
    }
}

// ======================================================
// BOAS-VINDAS
// ======================================================

client.on("guildMemberAdd", async member => {
    try {
        const canal = member.guild.channels.cache.get(
            WELCOME_CHANNEL_ID
        );

        if (!canal) {
            console.error(
                "❌ Canal de boas-vindas não encontrado."
            );
            return;
        }

        const contaCriada = Math.floor(
            member.user.createdTimestamp / 1000
        );

        const entrou = Math.floor(
            member.joinedTimestamp / 1000
        );

        const container = new ContainerBuilder();

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder()
                    .setURL(WELCOME_IMAGE_URL)
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "# 👋 Bem-vindo(a) à PML"
            )
        );

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${member}\n` +
                        `**ID:** ${member.user.id}\n` +
                        `**Conta criada:** <t:${contaCriada}:R>\n` +
                        `**Entrou:** <t:${entrou}:F>`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(
                        member.user.displayAvatarURL({
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
                "Você acabou de entrar na PML. Antes de usar os canais, faça a verificação e leia as informações principais.\n\n" +
                "> 🚫 <#1552633537939898469>\n" +
                "> ✅ <#1552648477635248169>\n" +
                "> 🎟️ <#1552649548420087909>"
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "-# PML • Pro Mps League"
            )
        );

        await canal.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        console.log(
            `👋 Boas-vindas enviadas para ${member.user.tag}`
        );
    } catch (error) {
        console.error(
            "❌ Erro ao enviar boas-vindas:",
            error
        );
    }
});

// ======================================================
// MENSAGENS DO TICKET / PARCERIA
// ======================================================

client.on("messageCreate", async message => {
    try {
        await handleTicketMessage(message);
    } catch (error) {
        console.error(
            "❌ Erro ao processar mensagem do ticket:",
            error
        );
    }
});

// ======================================================
// BOT PRONTO
// ======================================================

client.once("clientReady", async () => {
    console.log("=================================");
    console.log("🟢 PML BOT ONLINE");
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(
        `🏠 Servidores: ${client.guilds.cache.size}`
    );
    console.log("=================================");

    await registrarComandos();
});

// ======================================================
// INTERAÇÕES
// ======================================================

client.on("interactionCreate", async interaction => {
    try {
        // SHOUTS - COMANDO
        if (
            interaction.isChatInputCommand() &&
            interaction.commandName === "shouts"
        ) {
            return await executarShouts(interaction);
        }

        // SHOUTS - MODAL
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "modal_shouts"
        ) {
            const processado = await processarShouts(
                interaction
            );

            if (processado) return;
        }

        // BOTÕES DE CONTRATO
        if (interaction.isButton()) {
            const processado = await processarBotaoContrato(
                interaction
            );

            if (processado) return;
        }

        // FREE AGENCY
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "modal_freeagency"
        ) {
            const processado = await processarFreeAgency(
                interaction
            );

            if (processado) return;
        }

        // SCOUTING
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "modal_scouting"
        ) {
            const processado = await processarScouting(
                interaction
            );

            if (processado) return;
        }

        // RULES
        if (
            interaction.isStringSelectMenu() &&
            interaction.customId === "rules_select"
        ) {
            const processado = await processarRules(
                interaction
            );

            if (processado) return;
        }

        // TICKET: MENUS, BOTÕES E MODAIS
        if (
            interaction.isStringSelectMenu() ||
            interaction.isButton() ||
            interaction.isModalSubmit()
        ) {
            const processado = await handleTicketInteraction(
                interaction
            );

            if (processado) return;
        }

        // SLASH COMMANDS
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "ticket") {
                return await ticketCommand.execute(
                    interaction
                );
            }

            if (interaction.commandName === "freeagency") {
                return await freeagencyCommand.execute(
                    interaction
                );
            }

            if (interaction.commandName === "scouting") {
                return await scoutingCommand.execute(
                    interaction
                );
            }

            if (interaction.commandName === "rules") {
                return await rulesCommand.execute(
                    interaction
                );
            }

            if (
                interaction.commandName === "perm" ||
                interaction.commandName === "unperm" ||
                interaction.commandName === "permlist" ||
                interaction.commandName === "contract" ||
                interaction.commandName === "release" ||
                interaction.commandName === "criartime" ||
                interaction.commandName === "excluirtime" ||
                interaction.commandName === "autorelease"
            ) {
                return await executarComando(interaction);
            }
        }
    } catch (error) {
        console.error(
            "❌ Erro ao processar interação:",
            error
        );

        try {
            const resposta = {
                content:
                    "❌ Ocorreu um erro ao processar esta interação.",
                flags: MessageFlags.Ephemeral
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(resposta);
            } else {
                await interaction.reply(resposta);
            }
        } catch (replyError) {
            console.error(
                "❌ Não foi possível responder à interação:",
                replyError
            );
        }
    }
});

// ======================================================
// EVENTOS DE CONEXÃO DO DISCORD
// ======================================================

client.on("shardReady", shardId => {
    console.log(`🟢 SHARD ${shardId} conectado.`);
});

client.on("shardDisconnect", (event, shardId) => {
    console.error(
        `🔴 SHARD ${shardId} desconectou. Código: ${event.code}`
    );
});

client.on("shardReconnecting", shardId => {
    console.log(
        `🟡 SHARD ${shardId} tentando reconectar...`
    );
});

client.on("shardResume", (shardId, replayedEvents) => {
    console.log(
        `🟢 SHARD ${shardId} reconectado. ` +
        `Eventos recuperados: ${replayedEvents}`
    );
});

client.on("shardError", (error, shardId) => {
    console.error(
        `❌ Erro no SHARD ${shardId}:`,
        error
    );
});

client.on("error", error => {
    console.error(
        "❌ Erro do cliente Discord:",
        error
    );
});

client.on("warn", warning => {
    console.warn("⚠️ Discord.js:", warning);
});

// ======================================================
// LOGIN
// ======================================================

console.log("🔑 Conectando ao Discord...");

client.login(config.TOKEN)
    .then(() => {
        console.log("✅ Login no Discord realizado.");
    })
    .catch(error => {
        console.error(
            "❌ Erro ao conectar ao Discord:",
            error
        );
    });
