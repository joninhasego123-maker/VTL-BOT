const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags
} = require("discord.js");

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const RULES_CHANNEL_ID =
    "1552633537939898469";

// ======================================================
// COMANDO /RULES
// ======================================================

const rulesCommand =
    new SlashCommandBuilder()
        .setName("rules")
        .setDescription(
            "Envia o painel de regras da VTL."
        );

// ======================================================
// PAINEL PRINCIPAL
// ======================================================

function criarPainelRules() {

    const container =
        new ContainerBuilder();

    // ==================================================
    // SEPARADOR
    // ==================================================

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // TERMOS DO DISCORD
    // ==================================================

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "<a:arrow_arrow1:1554526129883451472> Todos os membros devem seguir os [**Termos de Serviço do Discord**](https://discord.com/terms) e todas as regras da comunidade."
            )

    );

    // ==================================================
    // POLÍTICA
    // ==================================================

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

    // ==================================================
    // SEPARADOR
    // ==================================================

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // BAN APPEALS
    // ==================================================

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "## <a:staff:1554530135590314046> Ban Appeals"
            )

    );

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "> Abra um ticket se quiser apelar um ban\n" +
                "> Você receberá uma resposta apos a revisão\n" +
                "> Entre em contato com <@1291821391271690333> para duvidas"
            )

    );

    // ==================================================
    // SEPARADOR
    // ==================================================

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // MENU
    // ==================================================

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                "rules_select"
            )
            .setPlaceholder(
                "Selecione uma categoria de regras"
            )
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(

                {
                    label:
                        "Regras gerais",

                    value:
                        "general_rules",

                    emoji:
                        "🚨"
                },

                {
                    label:
                        "Regras no jogo",

                    value:
                        "game_rules",

                    emoji:
                        "⚽"
                }

            );

    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(menu)
    );

    // ==================================================
    // SEPARADOR
    // ==================================================

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    // ==================================================
    // FOOTER
    // ==================================================

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "-# © 2026 VTL · Ao entrar você concorda com todas as regras."
            )

    );

    return container;
}

// ======================================================
// REGRAS GERAIS
// ======================================================

function criarRegrasGerais() {

    const container =
        new ContainerBuilder();

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "## ⚠️・REGRAS GERAIS"
            )

    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    const regras = [

        "```1. Respeite todos os membros da comunidade. Ofensas, provocações excessivas, preconceito ou qualquer tipo de discriminação não serão tolerados.```",

        "```2. É proibido spam, flood ou envio excessivo de mensagens, menções ou conteúdos sem propósito.```",

        "```3. Não envie conteúdos NSFW, ilegais ou inadequados para o ambiente da comunidade.```",

        "```4. É proibido divulgar outros servidores, comunidades ou serviços sem autorização da administração.```",

        "```5. Não utilize contas alternativas para burlar punições ou restrições aplicadas pela staff.```",

        "```6. Não tente explorar bugs, falhas ou vulnerabilidades do servidor ou dos sistemas da VTL.```",

        "```7. Não se passe por membros da staff, jogadores, managers ou outras pessoas.```",

        "```8. É proibido ameaçar, perseguir ou assediar outros membros da comunidade.```",

        "```9. Siga as orientações da staff durante partidas, competições e atividades oficiais.```",

        "```10. Discussões devem ser mantidas de maneira respeitosa. Evite iniciar ou prolongar conflitos desnecessários.```"

    ];

    for (const regra of regras) {

        container.addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(regra)

        );

    }

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "> 🔔 Ao permanecer no servidor, você concorda em seguir todas as regras estabelecidas pela administração.\n" +
                "> Tenha bom senso, respeite os outros e ajude a manter a comunidade organizada."
            )

    );

    return container;
}

// ======================================================
// REGRAS NO JOGO
// ======================================================

function criarRegrasJogo() {

    const regras = [

        "```1. Pausas\n\nAs pausas devem ser realizadas somente quando permitido pela arbitragem.```",

        "```2. Last Attack & Counter-Attack\n\nÉ proibido realizar Last Attack ou Counter-Attack em situações não permitidas pela arbitragem.```",

        "```3. Vantagem\n\nA vantagem poderá ser aplicada pela arbitragem quando houver benefício claro para a equipe que sofreu a falta.```",

        "```4. Desvios\n\nDesvios devem seguir as regras determinadas pela arbitragem.\n\n4.1 Decline\nO jogador poderá recusar determinadas situações de desvio quando previsto no regulamento.\n\n4.2 Humanoid\nSituações envolvendo humanoids deverão respeitar as decisões da arbitragem.```",

        "```5. Bundles\n\nÉ proibido utilizar bundles ou recursos que proporcionem vantagem indevida durante a partida.```",

        "```6. W.O / Auto-Win\n\nO W.O ou Auto-Win será aplicado somente nas situações previstas no regulamento.\n\n6.1 O não comparecimento de uma equipe poderá resultar em W.O.\n\n6.2 A equipe deverá cumprir o tempo limite determinado pela organização.\n\n6.3 A decisão final sobre W.O pertence à arbitragem/administração.```",

        "```7. Quantidade de Jogadores\n\nAs equipes devem respeitar a quantidade de jogadores determinada para cada partida.```",

        "```8. Cartão Amarelo (YC)\n\nO cartão amarelo poderá ser aplicado pela arbitragem em situações de infração ou comportamento inadequado.```",

        "```9. Lag\n\nProblemas de conexão devem ser comunicados à arbitragem. A arbitragem decidirá se a situação interfere na partida.```",

        "```10. Crowd\n\nO Crowd deve respeitar as limitações determinadas pela organização e pela arbitragem.```",

        "```11. Mercy Rule\n\nA Mercy Rule poderá ser aplicada quando a diferença de gols atingir o limite estabelecido pela competição.```",

        "```12. Handball\n\nMãos intencionais ou situações consideradas irregulares pela arbitragem poderão resultar em falta ou penalidade.```",

        "```13. Penalty Kicks\n\nCobranças de pênaltis devem ser realizadas de acordo com as regras da partida.\n\n13.1 Duplo Castigo\nO duplo castigo será aplicado quando previsto pelas regras e pela decisão da arbitragem.```",

        "```14. Space\n\nÉ proibido utilizar espaços ou posições de maneira que gere vantagem indevida ou viole as regras da partida.```",

        "```15. Faltas\n\nFaltas devem ser marcadas de acordo com a situação ocorrida e com a interpretação da arbitragem.```",

        "```16. Troca / Desrespeito\n\nTrocas de jogadores devem seguir o procedimento permitido. Desrespeito durante trocas poderá resultar em punição.```",

        "```17. Atraso de Jogo\n\nAtrasar propositalmente o andamento da partida poderá resultar em punição.```",

        "```18. Conduta com a Arbitragem\n\nTodos os jogadores e managers devem respeitar os árbitros. Discussões excessivas ou desrespeito poderão resultar em punição.```",

        "```19. Exploits / Bugs\n\nÉ proibido utilizar exploits, bugs ou falhas do jogo para obter vantagem.```",

        "```20. Kits e Aparência\n\nOs jogadores devem utilizar os kits e aparências permitidos pela organização.```",

        "```21. Comportamento Antidesportivo\n\nAtitudes consideradas antidesportivas poderão resultar em punição pela arbitragem ou administração.```",

        "```22. Regra Geral da Arbitragem\n\nAs decisões da arbitragem durante a partida devem ser respeitadas. Casos não previstos serão analisados pela arbitragem e pela administração.```"

    ];

    return regras;

}

// ======================================================
// DISPOSIÇÕES FINAIS
// ======================================================

function criarDisposicoesFinais() {

    const container =
        new ContainerBuilder();

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "## 📌 | DISPOSIÇÕES FINAIS"
            )

    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "```O desconhecimento das regras não isenta nenhum jogador ou equipe de suas responsabilidades.```"
            )

    );

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "```As regras poderão ser atualizadas pela administração da ULTIMATE TCS LEAGUE sempre que necessário.```"
            )

    );

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "```Todos os jogadores, managers e equipes são responsáveis por conhecer e respeitar este Rulebook antes do início de suas partidas.```"
            )

    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                "-# VTL • Virtual Tcs League"
            )

    );

    return container;
}

// ======================================================
// EXECUTAR /RULES
// ======================================================

async function executarRules(interaction) {

    if (
        interaction.channelId !==
        RULES_CHANNEL_ID
    ) {

        return interaction.reply({

            content:
                `❌ O comando /rules só pode ser usado em <#${RULES_CHANNEL_ID}>.`,

            flags:
                MessageFlags.Ephemeral

        });

    }

    await interaction.channel.send({

        components: [
            criarPainelRules()
        ],

        flags:
            MessageFlags.IsComponentsV2

    });

    return interaction.reply({

        content:
            "✅ Painel de regras enviado!",

        flags:
            MessageFlags.Ephemeral

    });

}

// ======================================================
// PROCESSAR MENU DE REGRAS
// ======================================================

async function processarRules(interaction) {

    if (
        !interaction.isStringSelectMenu()
    ) {

        return false;

    }

    if (
        interaction.customId !==
        "rules_select"
    ) {

        return false;

    }

    const escolha =
        interaction.values[0];

    // ==================================================
    // REGRAS GERAIS
    // ==================================================

    if (
        escolha ===
        "general_rules"
    ) {

        return interaction.reply({

            components: [
                criarRegrasGerais()
            ],

            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral

        });

    }

    // ==================================================
    // REGRAS NO JOGO
    // ==================================================

    if (
        escolha ===
        "game_rules"
    ) {

        const regras =
            criarRegrasJogo();

        const primeiraParte =
            new ContainerBuilder();

        primeiraParte.addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(
                    "## ⚽・REGRAS NO JOGO"
                )

        );

        primeiraParte.addSeparatorComponents(
            new SeparatorBuilder()
        );

        // REGRAS 1 ATÉ 7

        for (
            let i = 0;
            i < 7;
            i++
        ) {

            primeiraParte.addTextDisplayComponents(

                new TextDisplayBuilder()
                    .setContent(
                        regras[i]
                    )

            );

        }

        const segundaParte =
            new ContainerBuilder();

        segundaParte.addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(
                    "## ⚽・REGRAS NO JOGO"
                )

        );

        segundaParte.addSeparatorComponents(
            new SeparatorBuilder()
        );

        // REGRAS 8 ATÉ 15

        for (
            let i = 7;
            i < 15;
            i++
        ) {

            segundaParte.addTextDisplayComponents(

                new TextDisplayBuilder()
                    .setContent(
                        regras[i]
                    )

            );

        }

        const terceiraParte =
            new ContainerBuilder();

        terceiraParte.addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(
                    "## ⚽・REGRAS NO JOGO"
                )

        );

        terceiraParte.addSeparatorComponents(
            new SeparatorBuilder()
        );

        // REGRAS 16 ATÉ 22

        for (
            let i = 15;
            i < regras.length;
            i++
        ) {

            terceiraParte.addTextDisplayComponents(

                new TextDisplayBuilder()
                    .setContent(
                        regras[i]
                    )

            );

        }

        terceiraParte.addSeparatorComponents(
            new SeparatorBuilder()
        );

        terceiraParte.addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(
                    "-# VTL • Virtual Tcs League"
                )

        );

        await interaction.reply({

            components: [
                primeiraParte
            ],

            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral

        });

        await interaction.followUp({

            components: [
                segundaParte
            ],

            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral

        });

        await interaction.followUp({

            components: [
                terceiraParte,
                criarDisposicoesFinais()
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
// EXECUTE
// ======================================================

rulesCommand.execute =
    executarRules;

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