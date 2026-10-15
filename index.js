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

const config = require("./config");

// Site + API (substitui o servidor HTTP antigo, tamb\u00e9m serve para o Render)
require("./server");

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
    aprovarCommand,
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
// CONFIGURA\u00c7\u00c3O
// ======================================================

const WELCOME_CHANNEL_ID = "1552633149123596308";

const WELCOME_IMAGE_URL =
    "https://plain-enam-prod-public.komododecks.com/202609/29/F3Bzfcvoph52mKCch3Wi/image.png";

// Comandos tratados pelo contract.js
const COMANDOS_CONTRATO = [
    "perm",
    "unperm",
    "permlist",
    "contract",
    "release",
    "criartime",
    "excluirtime",
    "autorelease",
    "aprovar"
];

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ======================================================
// COMANDOS
// ======================================================

const commands = [

    // TICKET
    ticketCommand,

    // FREE AGENCY
    freeagencyCommand,

    // SCOUTING
    scoutingCommand,

    // RULES
    rulesCommand,

    // SHOUTS
    shoutsCommand,

    // CONTRATOS / TIMES
    permCommand,
    unpermCommand,
    permlistCommand,
    contractCommand,
    releaseCommand,
    criarTimeCommand,
    excluirTimeCommand,
    autoreleaseCommand,
    aprovarCommand

].map(command => command.toJSON());

// ======================================================
// REGISTRAR SLASH COMMANDS
// ======================================================

async function registrarComandos() {

    try {

        const rest = new REST({ version: "10" })
            .setToken(config.TOKEN);

        console.log("\ud83d\udd04 Registrando comandos...");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log(
            `\u2705 ${commands.length} comandos registrados com sucesso.`
        );

    } catch (error) {

        console.error("\u274c Erro ao registrar comandos:", error);

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
            console.error("\u274c Canal de boas-vindas n\u00e3o encontrado.");
            return;
        }

        const contaCriada = Math.floor(
            member.user.createdTimestamp / 1000
        );

        const entrou = Math.floor(
            member.joinedTimestamp / 1000
        );

        const container = new ContainerBuilder();

        // IMAGEM
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(WELCOME_IMAGE_URL)
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        // T\u00cdTULO
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "# \ud83d\udc4b Bem-vindo(a) \u00e0 PML"
            )
        );

        // USU\u00c1RIO / ID / DATAS / AVATAR
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

        container.addSeparatorComponents(new SeparatorBuilder());

        // TEXTO
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "Voc\u00ea acabou de entrar na PML. Antes de usar os canais, fa\u00e7a a verifica\u00e7\u00e3o e leia as informa\u00e7\u00f5es principais.\n\n" +
                `> \ud83d\udeab <#1552633537939898469>\n` +
                `> \u2705 <#1552648477635248169>\n` +
                `> \ud83c\udf9f\ufe0f <#1552649548420087909>`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        // FOOTER
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "-# PML \u2022 Pro Mps League"
            )
        );

        await canal.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        console.log(
            `\ud83d\udc4b Boas-vindas enviadas para ${member.user.tag}`
        );

    } catch (error) {

        console.error("\u274c Erro ao enviar boas-vindas:", error);

    }

});

// ======================================================
// MENSAGENS DO TICKET
// NECESS\u00c1RIO PARA ANALISAR AS PRINTS DE PARCERIA
// ======================================================

client.on("messageCreate", async message => {

    try {

        await handleTicketMessage(message);

    } catch (error) {

        console.error(
            "\u274c Erro ao processar mensagem do ticket:",
            error
        );

    }

});

// ======================================================
// BOT PRONTO
// ======================================================

client.once("clientReady", async () => {

    console.log("=================================");
    console.log("\ud83d\udfe2 VTL BOT ONLINE");
    console.log(`\ud83e\udd16 Bot: ${client.user.tag}`);
    console.log(`\ud83c\udd94 ID: ${client.user.id}`);
    console.log(`\ud83c\udfe0 Servidores: ${client.guilds.cache.size}`);
    console.log("=================================");

    await registrarComandos();

});

// ======================================================
// INTERA\u00c7\u00d5ES
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
            const processado = await processarShouts(interaction);
            if (processado) return;
        }

        // BOT\u00d5ES DE CONTRATO
        if (interaction.isButton()) {
            const processado = await processarBotaoContrato(interaction);
            if (processado) return;
        }

        // FREE AGENCY
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "modal_freeagency"
        ) {
            const processado = await processarFreeAgency(interaction);
            if (processado) return;
        }

        // SCOUTING
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "modal_scouting"
        ) {
            const processado = await processarScouting(interaction);
            if (processado) return;
        }

        // RULES
        if (
            interaction.isStringSelectMenu() &&
            interaction.customId === "rules_select"
        ) {
            const processado = await processarRules(interaction);
            if (processado) return;
        }

        // INTERA\u00c7\u00d5ES DO TICKET
        if (
            interaction.isStringSelectMenu() ||
            interaction.isButton() ||
            interaction.isModalSubmit()
        ) {
            const processado = await handleTicketInteraction(interaction);
            if (processado) return;
        }

        // SLASH COMMANDS
        if (interaction.isChatInputCommand()) {

            const nome = interaction.commandName;

            if (nome === "ticket") {
                return await ticketCommand.execute(interaction);
            }

            if (nome === "freeagency") {
                return await freeagencyCommand.execute(interaction);
            }

            if (nome === "scouting") {
                return await scoutingCommand.execute(interaction);
            }

            if (nome === "rules") {
                return await rulesCommand.execute(interaction);
            }

            if (COMANDOS_CONTRATO.includes(nome)) {
                return await executarComando(interaction);
            }

        }

    } catch (error) {

        console.error(
            "\u274c Ocorreu um erro ao processar esta intera\u00e7\u00e3o:",
            error
        );

        try {

            const aviso = {
                content: "\u274c Ocorreu um erro ao processar esta intera\u00e7\u00e3o.",
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(aviso);
            } else {
                await interaction.reply(aviso);
            }

        } catch (replyError) {

            console.error(
                "\u274c N\u00e3o foi poss\u00edvel responder \u00e0 intera\u00e7\u00e3o:",
                replyError
            );

        }

    }

});

// ======================================================
// EVENTOS DE CONEX\u00c3O DO DISCORD
// ======================================================

client.on("shardReady", shardId => {
    console.log(`\ud83d\udfe2 SHARD ${shardId} conectado.`);
});

client.on("shardDisconnect", (event, shardId) => {
    console.error(
        `\ud83d\udd34 SHARD ${shardId} desconectou. C\u00f3digo: ${event.code}`
    );
});

client.on("shardReconnecting", shardId => {
    console.log(`\ud83d\udfe1 SHARD ${shardId} tentando reconectar...`);
});

client.on("shardResume", (shardId, replayedEvents) => {
    console.log(
        `\ud83d\udfe2 SHARD ${shardId} reconectado. ` +
        `Eventos recuperados: ${replayedEvents}`
    );
});

client.on("shardError", (error, shardId) => {
    console.error(`\u274c Erro no SHARD ${shardId}:`, error);
});

client.on("error", error => {
    console.error("\u274c Erro do cliente Discord:", error);
});

client.on("warn", warning => {
    console.warn("\u26a0\ufe0f Discord.js:", warning);
});

// ======================================================
// LOGIN
// ======================================================

console.log("\ud83d\udd11 Conectando ao Discord...");

client.login(config.TOKEN)

    .then(() => {
        console.log("\u2705 Login no Discord realizado.");
    })

    .catch(error => {
        console.error("\u274c Erro ao conectar ao Discord:", error);
    });
