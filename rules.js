const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    MessageFlags
} = require("discord.js");

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const RULES_CHANNEL_ID = "1552633537939898469";

const RULES_IMAGE_URL =
    "https://plain-enam-prod-public.komododecks.com/202609/29/GV0ZHbsSKoyh7gJ7wkAC/image.png";

// ======================================================
// COMANDO /RULES
// ======================================================

const rulesCommand = new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Envia o painel de regras da VTL.")
    .setDefaultMemberPermissions("8");

// ======================================================
// REGRAS GERAIS
// ======================================================

function criarRegrasGerais() {

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "# 📜・REGRAS GERAIS\n\n" +

                "```1. 🤝 Respeito\n" +
                "Trate todos os membros com respeito. Não serão tolerados insultos, preconceito, discriminação, perseguição ou provocações excessivas.```\n\n" +

                "```2. 💬 Uso dos canais\n" +
                "Utilize cada canal de acordo com sua finalidade e evite mensagens fora de contexto ou spam.```\n\n" +

                "```3. 🚫 Spam e Flood\n" +
                "É proibido enviar mensagens repetitivas, excesso de menções, emojis ou qualquer conteúdo que prejudique a organização do servidor.```\n\n" +

                "```4. 📢 Divulgação\n" +
                "Não faça divulgação de outros servidores, redes sociais, links ou projetos sem autorização da administração.```\n\n" +

                "```5. 🔒 Segurança\n" +
                "Não compartilhe informações pessoais suas ou de outros membros. Também é proibido tentar prejudicar, invadir ou comprometer contas e sistemas.```\n\n" +

                "```6. ⚠️ Conteúdo proibido\n" +
                "Não envie conteúdos ilegais, NSFW, extremamente ofensivos ou que possam colocar outros membros em risco.```\n\n" +

                "```7. 👮 Equipe\n" +
                "Respeite as decisões da equipe de moderação. Caso discorde de alguma decisão, procure um membro da administração de forma adequada.```\n\n" +

                "```8. 📝 Responsabilidade\n" +
                "Cada membro é responsável pelo conteúdo que envia no servidor. Alegar desconhecimento das regras não isenta o membro de possíveis punições.```\n\n" +

                "```9. ⚖️ Punições\n" +
                "O descumprimento das regras poderá resultar em advertência, mute, expulsão ou banimento, dependendo da gravidade da situação.```\n\n" +

                "```10. 📌 Regras adicionais\n" +
                "Canais, eventos ou sistemas específicos podem possuir regras próprias. Sempre leia as orientações antes de utilizá-los.```\n\n" +

                "> 🔔 Ao permanecer no servidor, você concorda em seguir todas as regras estabelecidas pela administração.\n\n" +

                "> Tenha bom senso, respeite os outros e ajude a manter a comunidade organizada."
            )
    );

    return container;
}

// ======================================================
// REGRAS NO JOGO
// ======================================================

function criarRegrasJogo() {

    const container = new ContainerBuilder();

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(
                new MediaGalleryItemBuilder()
                    .setURL(RULES_IMAGE_URL)
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("# ⚽ Regras no Jogo")
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "```1. Pausas\n\n" +
                "As pausas só poderão ser realizadas em situações permitidas pela arbitragem.```\n\n" +

                "```2. Last Attack & Counter-Attack\n\n" +
                "É proibido iniciar um novo ataque imediatamente após uma jogada de Last Attack ou Counter-Attack quando a situação não permitir.```\n\n" +

                "```3. Vantagem\n\n" +
                "A arbitragem poderá aplicar a regra da vantagem quando uma infração não impedir a continuidade da jogada.```\n\n" +

                "```4. Desvios\n\n" +
                "Desvios deverão seguir as decisões estabelecidas pela arbitragem.\n\n" +
                "4.1 Decline\n\n" +
                "Situações de Decline serão avaliadas pela arbitragem.\n\n" +
                "4.2 Humanoid\n\n" +
                "Situações envolvendo Humanoid deverão seguir a decisão da arbitragem.```\n\n" +

                "```5. Chars\n\n" +
                "O uso de Chars com korblox ou algo do tipo é proibido pela liga.```\n\n" +

                "```6. W.O / Auto-Win\n\n" +
                "O W.O poderá ser aplicado em casos de ausência ou descumprimento das condições necessárias para realização da partida.\n\n" +
                "6.1 A equipe deverá estar presente no horário determinado.\n\n" +
                "6.2 A ausência injustificada poderá resultar em W.O.\n\n" +
                "6.3 A decisão final caberá à arbitragem/staff.```\n\n" +

                "```7. Quantidade de Jogadores\n\n" +
                "As equipes deverão respeitar a quantidade de jogadores determinada para cada partida.```\n\n" +

                "```8. Cartão Amarelo (YC)\n\n" +
                "Cartões amarelos poderão ser aplicados pela arbitragem conforme as infrações cometidas.```\n\n" +

                "```9. Lag\n\n" +
                "Problemas de conexão deverão ser comunicados à arbitragem. A decisão sobre paralisação ou continuidade caberá à arbitragem.```\n\n" +

                "```10. Crowd\n\n" +
                "Situações envolvendo Crowd deverão respeitar as decisões e orientações da arbitragem.```\n\n" +

                "```11. Mercy Rule\n\n" +
                "A Mercy Rule poderá ser aplicada conforme as condições estabelecidas para a partida.```\n\n" +

                "```12. Handball\n\n" +
                "Infrações de Handball poderão ser marcadas pela arbitragem conforme a situação da jogada.```\n\n" +

                "```13. Penalty Kicks\n\n" +
                "Cobranças de pênaltis deverão seguir as determinações da arbitragem.\n\n" +
                "13.1 Duplo Castigo\n\n" +
                "Situações de Duplo Castigo serão avaliadas de acordo com a infração cometida.```\n\n" +

                "```14. Space\n\n" +
                "O uso de espaço durante as partidas deverá respeitar as regras estabelecidas pela liga.```\n\n" +

                "```15. Faltas\n\n" +
                "Faltas serão marcadas pela arbitragem conforme a situação da partida.```\n\n" +

                "```16. Troca / Desrespeito\n\n" +
                "Trocas e situações de desrespeito deverão seguir as orientações da arbitragem e da staff.```\n\n" +

                "```17. Atraso de Jogo\n\n" +
                "É proibido causar atrasos desnecessários no andamento da partida.```\n\n" +

                "```18. Conduta com a Arbitragem\n\n" +
                "Todos os jogadores e managers devem manter respeito com a arbitragem.```\n\n" +

                "```19. Exploits / Bugs\n\n" +
                "É proibido utilizar exploits, bugs ou falhas do jogo para obter vantagem.```\n\n" +

                "```20. Kits e Aparência\n\n" +
                "Os jogadores deverão utilizar kits e aparências permitidos pela organização.```\n\n" +

                "```21. Comportamento Antidesportivo\n\n" +
                "Qualquer comportamento antidesportivo poderá ser punido pela arbitragem ou pela staff.```\n\n" +

                "```22. Regra Geral da Arbitragem\n\n" +
                "As decisões da arbitragem durante a partida deverão ser respeitadas.```"
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "# 📜 Disposições Finais\n\n" +

                "> O desconhecimento das regras não isenta nenhum jogador ou equipe de suas responsabilidades.\n\n" +

                "> As regras poderão ser atualizadas pela administração da **VIRTUAL TCS LEAGUE** sempre que necessário.\n\n" +

                "> Todos os jogadores, managers e equipes são responsáveis por conhecer e respeitar este Rulebook antes do início de suas partidas."
            )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "-# © 2026 VTL · VIRTUAL TCS LEAGUE"
            )
    );

    return container;
}

// ======================================================
// DISPOSIÇÕES FINAIS
// ======================================================

function criarDisposicoesFinais() {

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "# 📜 Disposições Finais\n\n" +

                "> O desconhecimento das regras não isenta nenhum jogador ou equipe de suas responsabilidades.\n\n" +

                "> As regras poderão ser atualizadas pela administração da **VIRTUAL TCS LEAGUE** sempre que necessário.\n\n" +

                "> Todos os jogadores, managers e equipes são responsáveis por conhecer e respeitar este Rulebook antes do início de suas partidas."
            )
    );

    return container;
}

// ======================================================
// PAINEL PRINCIPAL
// ======================================================

function criarPainelRules() {

    const container = new ContainerBuilder();

    container.addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(
                new MediaGalleryItemBuilder()
                    .setURL(RULES_IMAGE_URL)
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "<a:arrow_arrow1:1554526129883451472> Todos os membros devem seguir os [**Termos de Serviço do Discord**](https://discord.com/terms) e todas as regras da comunidade."
            )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "```ansi\n" +
                "\u001b[1;31m━━━━━━━━━━  POLÍTICA  ━━━━━━━━━━\u001b[0m\n" +
                "\u001b[0;31m  ✗  Decisões da staff são finais\n" +
                "  ✗  Não discuta nem escale\u001b[0m\n" +
                "```"
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "## <a:staff:1554530135590314046> Ban Appeals\n" +
                "> Abra um ticket se quiser apelar um ban\n" +
                "> Você receberá uma resposta apos a revisão\n" +
                "> Entre em contato com <@1291821391271690333> para duvidas"
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId("rules_select")
            .setPlaceholder("Selecione uma categoria")
            .addOptions(
                {
                    label: "Regras gerais",
                    value: "2fed7d987004446bf22558e9d1e74a1e",
                    emoji: "🚨"
                },
                {
                    label: "Regras no jogo",
                    value: "e82011c4280f4009b35b314a2ff33bb4",
                    emoji: "⚽"
                }
            );

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(menu)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "-# © 2026 VTL · Ao entrar você concorda com todas as regras."
            )
    );

    return container;
}

// ======================================================
// PROCESSAR MENU
// ======================================================

async function processarRules(interaction) {

    if (
        !interaction.isStringSelectMenu() ||
        interaction.customId !== "rules_select"
    ) {
        return false;
    }

    const valor = interaction.values[0];

    // REGRAS GERAIS
    if (
        valor ===
        "2fed7d987004446bf22558e9d1e74a1e"
    ) {

        await interaction.reply({
            components: [
                criarRegrasGerais()
            ],
            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral
        });

        return true;
    }

    // REGRAS NO JOGO
    if (
        valor ===
        "e82011c4280f4009b35b314a2ff33bb4"
    ) {

        await interaction.reply({
            components: [
                criarRegrasJogo()
            ],
            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral
        });

        return true;
    }

    return false;
}

// ======================================================
// EXECUTAR /RULES
// ======================================================

rulesCommand.execute = async interaction => {

    // ==================================================
    // PROTEÇÃO CONTRA NÃO-ADMINISTRADORES
    // ==================================================

    if (
        !interaction.memberPermissions ||
        !interaction.memberPermissions.has("Administrator")
    ) {

        await interaction.reply({
            content:
                "❌ Você precisa ter **Administrador** para usar este comando.",
            ephemeral: true
        });

        return;
    }

    // ==================================================
    // ENVIO DO PAINEL
    // ==================================================

    try {

        const canalRules =
            await interaction.client.channels.fetch(
                RULES_CHANNEL_ID
            );

        if (!canalRules) {

            await interaction.reply({
                content:
                    "❌ Não foi possível encontrar o canal de regras.",
                ephemeral: true
            });

            return;
        }

        await canalRules.send({
            components: [
                criarPainelRules()
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

        await interaction.reply({
            content:
                `✅ Painel de regras enviado em <#${RULES_CHANNEL_ID}>.`,
            ephemeral: true
        });

    } catch (error) {

        console.error(
            "❌ Erro ao enviar painel de regras:",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({
                content:
                    "❌ Não foi possível enviar o painel de regras.",
                ephemeral: true
            });

        } else {

            await interaction.reply({
                content:
                    "❌ Não foi possível enviar o painel de regras.",
                ephemeral: true
            });

        }
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    rulesCommand,
    processarRules,
    criarPainelRules,
    criarRegrasGerais,
    criarRegrasJogo,
    criarDisposicoesFinais
};