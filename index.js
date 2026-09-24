const {
    Client,
    GatewayIntentBits,
    REST,
    Routes
} = require("discord.js");

const http = require("http");
const config = require("./config");

const {
    ticketCommand,
    handleTicketInteraction
} = require("./ticket");

const {
    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand,
    executarComando,
    processarBotaoContrato
} = require("./contract");

const {
    freeagencyCommand
} = require("./freeagency");

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// ======================================================
// COMANDOS
// ======================================================

const commands = [
    ticketCommand,
    freeagencyCommand,
    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand
].map(command => command.toJSON());

// ======================================================
// SERVIDOR HTTP
// NECESSÁRIO PARA O RENDER
// ======================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("VTL Bot online!");
});

server.listen(PORT, () => {
    console.log(`🌐 Servidor HTTP online na porta ${PORT}`);
});

// ======================================================
// REGISTRAR SLASH COMMANDS
// ======================================================

async function registrarComandos() {

    try {

        const rest = new REST({
            version: "10"
        }).setToken(config.TOKEN);

        console.log("🔄 Registrando comandos...");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: commands
            }
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
// BOT PRONTO
// ======================================================

client.once("clientReady", async () => {

    console.log("=================================");
    console.log("🟢 VTL BOT ONLINE");
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`🏠 Servidores: ${client.guilds.cache.size}`);
    console.log("=================================");

    await registrarComandos();
});

// ======================================================
// INTERAÇÕES
// ======================================================

client.on("interactionCreate", async interaction => {

    try {

        // ==============================================
        // BOTÕES DE CONTRATO
        // ==============================================

        if (interaction.isButton()) {

            const processado =
                await processarBotaoContrato(interaction);

            if (processado) {
                return;
            }
        }

        // ==============================================
        // INTERAÇÕES DO TICKET
        // ==============================================

        if (
            interaction.isStringSelectMenu() ||
            interaction.isButton() ||
            interaction.isModalSubmit()
        ) {

            const processado =
                await handleTicketInteraction(interaction);

            if (processado) {
                return;
            }
        }

        // ==============================================
        // SLASH COMMANDS
        // ==============================================

        if (interaction.isChatInputCommand()) {

            // ------------------------------
            // TICKET
            // ------------------------------

            if (interaction.commandName === "ticket") {

                return await ticketCommand.execute(
                    interaction
                );
            }

            // ------------------------------
            // FREE AGENCY
            // ------------------------------

            if (interaction.commandName === "freeagency") {

                return await freeagencyCommand.execute(
                    interaction
                );
            }

            // ------------------------------
            // CONTRATOS
            // ------------------------------

            if (
                interaction.commandName === "perm" ||
                interaction.commandName === "unperm" ||
                interaction.commandName === "permlist" ||
                interaction.commandName === "contract" ||
                interaction.commandName === "release"
            ) {

                return await executarComando(
                    interaction
                );
            }
        }

    } catch (error) {

        console.error(
            "❌ Ocorreu um erro ao processar esta interação:",
            error
        );

        try {

            if (interaction.replied || interaction.deferred) {

                await interaction.followUp({
                    content:
                        "❌ Ocorreu um erro ao processar esta interação.",
                    ephemeral: true
                });

            } else {

                await interaction.reply({
                    content:
                        "❌ Ocorreu um erro ao processar esta interação.",
                    ephemeral: true
                });
            }

        } catch (replyError) {

            console.error(
                "❌ Não foi possível enviar a mensagem de erro:",
                replyError
            );
        }
    }
});

// ======================================================
// EVENTOS DE CONEXÃO DO DISCORD
// ======================================================

client.on("shardReady", shardId => {

    console.log(
        `🟢 SHARD ${shardId} conectado.`
    );
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

    console.warn(
        "⚠️ Discord.js:",
        warning
    );
});

// ======================================================
// LOGIN
// ======================================================

console.log("🔑 Conectando ao Discord...");

client.login(config.TOKEN)
    .then(() => {

        console.log(
            "✅ Login no Discord realizado."
        );

    })
    .catch(error => {

        console.error(
            "❌ Erro ao conectar ao Discord:",
            error
        );

    });
