const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const fetch = require('node-fetch');


const GITHUB_TOKEN = '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';
const REPO = 'Lczxy4x/authbot';
const FILE_PATH_KEYS = 'keys.json';
const FILE_PATH_USERS = 'users.json';
const DISCORD_TOKEN = 'MTM2NzE5NzI0MzU3NjQxODM2Ng.GxhyyU.EBJpKJi6Q4-vHpx5u4vKTmwvRQhuQZkJAtukVc';
const CLIENT_ID = '1367197243576418366';
const GUILD_ID = '1367197117180805210';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('criarkey')
        .setDescription('Cria uma nova key ou múltiplas.')
        .addStringOption(option => 
            option.setName('key')
                .setDescription("Key a ser criada. Use '*' para gerar caracteres aleatórios.")
                .setRequired(true))
        .addStringOption(option => 
            option.setName('expiracao')
                .setDescription("Tempo de expiração da key (ex: 1h, 1d, vitalício).")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription("Quantidade de keys a serem criadas. (Apenas se usar '*' na chave.)")
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('criaruser')
        .setDescription('Cria um usuário com expiração.')
        .addStringOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addStringOption(opt => opt.setName('senha').setDescription('Senha').setRequired(true))
        .addStringOption(opt => opt.setName('expiracao').setDescription('Ex: 1h, 1d, vitalício').setRequired(true)),

    new SlashCommandBuilder()
        .setName('gerenciarkeys')
        .setDescription('Gerenciar keys (resetar HWID, excluir, etc).'),

    new SlashCommandBuilder()
        .setName('gerenciarusers')
        .setDescription('Gerenciar usuários (resetar HWID, estender tempo, excluir, etc).'),

    new SlashCommandBuilder()
        .setName('deletarkey')
        .setDescription('Excluir uma key.')
        .addStringOption(option => 
            option.setName('key')
                .setDescription('A key que você deseja excluir.')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('deletaruser')
        .setDescription('Excluir um usuário.')
        .addStringOption(option => 
            option.setName('user')
                .setDescription('O nome do usuário que você deseja excluir.')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('resetarhwidkey')
        .setDescription('Reseta o HWID de uma key específica.')
        .addStringOption(option => 
            option.setName('key')
                .setDescription('A key para a qual o HWID será resetado.')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('resetarhwiduser')
        .setDescription('Reseta o HWID de um usuário específico.')
        .addStringOption(option => 
            option.setName('user')
                .setDescription('O usuário para o qual o HWID será resetado.')
                .setRequired(true)),

     new SlashCommandBuilder()
                .setName('infouser')
                .setDescription('Exibe informações de um usuário específico.')
                .addStringOption(option =>
                    option.setName('user')
                        .setDescription('O nome do usuário')
                        .setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('infokey')
                .setDescription('Exibe informações de uma key específica.')
                .addStringOption(option =>
                    option.setName('key')
                        .setDescription('A key que deseja consultar')
                        .setRequired(true)),
     new SlashCommandBuilder()
        .setName('perms')
        .setDescription('Gerenciar usuários autorizados a usar o bot'),
            
].map(cmd => cmd.toJSON());


const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registrando comandos...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Comandos registrados com sucesso!');
    } catch (err) {
        console.error('Erro ao registrar comandos:', err);
    }
})();





client.once('ready', () => {
    console.log(`🤖 Bot iniciado como ${client.user.tag}`);
});

async function readJsonFile(filePath) {
    const response = await axios.get(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
}

async function writeJsonFile(filePath, data) {
    const response = await axios.get(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const sha = response.data.sha;
    await axios.put(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
        message: 'Atualização via bot',
        content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
        sha: sha
    }, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
}




function getExpirationMillis(exp) {
    if (exp === 'vitalício') return Infinity;
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
    }
}

async function calcularTempoRestante(expiration, usedAt) {
    if (expiration === 'vitalício') return 'Vitalício';

    if (!usedAt) return 'Não usada';

    const expMillis = getExpirationMillis(expiration);
    const expirationDate = usedAt + expMillis;

    const now = Date.now();

    if (now >= expirationDate) return 'Expirado';

    const remainingMillis = expirationDate - now;

    const days = Math.floor(remainingMillis / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMillis % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMillis % (60 * 60 * 1000)) / (60 * 1000));

    return `Faltam ${days}d ${hours}h ${minutes}m`;
}

// Função para gerar um caractere aleatório
const randomChar = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return chars.charAt(Math.floor(Math.random() * chars.length));
};

// Função para gerar a chave com caracteres aleatórios
const generateKey = (keyPattern) => {
    let key = "";
    for (const char of keyPattern) {
        key += (char === "*") ? randomChar() : char;
    }
    return key;
};


let userPages = {};  // Objeto para armazenar a página de cada usuário


let userUserPages = {}; // Armazena a página atual de cada usuário para usuários


client.on('interactionCreate', async (interaction) => {
    const userId = interaction.user.id;

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'gerenciarkeys') {
            if (!userPages[userId]) userPages[userId] = 1;

            const data = await readJsonFile(FILE_PATH_KEYS);
            const keysList = data.keys.map(k => ({ label: k.key, value: k.key }));
            const keysPerPage = 25;
            const totalPages = Math.ceil(keysList.length / keysPerPage);
            const currentPage = userPages[userId];
            const keysPage = keysList.slice((currentPage - 1) * keysPerPage, currentPage * keysPerPage);

            let descricao = '';
            for (const k of keysPage) {
                const keyData = data.keys.find(key => key.key === k.value);
                if (keyData) {
                    const tempoRestante = await calcularTempoRestante(keyData.expiration, keyData.usedAt);
                    descricao += `🔑 \`${keyData.key}\`\nHWID: \`${keyData.hwid || 'Nenhum'}\` | Status: \`${keyData.status}\` | Expiração: \`${keyData.expiration}\` | Tempo restante: \`${tempoRestante}\`\n\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Gerenciamento de Keys')
                .setDescription(descricao || 'Nenhuma key cadastrada.')
                .setColor(0x0099ff);

            const components = [];

            if (data.keys.length > 0) {
                components.push(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('gerenciarKeysSelect')
                            .setPlaceholder('Selecione uma key para gerenciar')
                            .addOptions(keysPage)
                    ),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('excluirKey').setLabel('Excluir').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('resetarKey').setLabel('Resetar HWID').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('excluirKeysExpiradas').setLabel('Excluir Keys Expiradas').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('excluirKeysUsadas').setLabel('Excluir Keys Usadas').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('excluirTodasKeys').setLabel('Excluir All Keys').setStyle(ButtonStyle.Danger)
                    ),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('atualizarkeys').setLabel('Atualizar').setStyle(ButtonStyle.Primary)
                    )
                );


                if (totalPages > 1) {
                    components.push(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('nextPage').setLabel('Próxima Página').setStyle(ButtonStyle.Primary).setDisabled(currentPage >= totalPages),
                        new ButtonBuilder().setCustomId('prevPage').setLabel('Página Anterior').setStyle(ButtonStyle.Primary).setDisabled(currentPage <= 1)
                    ));
                    
                }
                
            }

            await interaction.reply({ embeds: [embed], components });
        }

        if (interaction.commandName === 'gerenciarusers') {
            if (!userUserPages[userId]) userUserPages[userId] = 1;

            const data = await readJsonFile(FILE_PATH_USERS);
            const usersList = data.users.map(u => ({ label: u.username, value: u.username }));
            const usersPerPage = 25;
            const totalPages = Math.ceil(usersList.length / usersPerPage);
            const currentPage = userUserPages[userId];
            const usersPage = usersList.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

            let descricao = '';
            for (const u of usersPage) {
                const userData = data.users.find(user => user.username === u.value);
                if (userData) {
                    const tempoRestante = userData.usedAt
                        ? await calcularTempoRestante(userData.expiration, userData.usedAt)
                        : 'Não usada';
                    descricao += `👤 \`${userData.username}\`\nHWID: \`${userData.hwid || 'Nenhum'}\` | Status: \`${userData.status}\` | Expiração: \`${userData.expiration}\` | Tempo restante: \`${tempoRestante}\`\n\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Gerenciamento de Usuários')
                .setDescription(descricao || 'Nenhum usuário cadastrado.')
                .setColor(0x0099ff);

            const components = [];

            if (data.users.length > 0) {
                components.push(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('gerenciarUsersSelect')
                            .setPlaceholder('Selecione um usuário para gerenciar')
                            .addOptions(usersPage)
                    ),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('excluirUser').setLabel('Excluir').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('resetarUser').setLabel('Resetar HWID').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('excluirUsuariosExpirados').setLabel('Excluir Users Expirado').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('excluirTodosUsuarios').setLabel('Excluir All Users').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('atualizarusers').setLabel('Atualizar').setStyle(ButtonStyle.Primary)
                    ),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prevUserPage').setLabel('Página Anterior').setStyle(ButtonStyle.Primary).setDisabled(currentPage <= 1),
                        new ButtonBuilder().setCustomId('nextUserPage').setLabel('Próxima Página').setStyle(ButtonStyle.Primary).setDisabled(currentPage >= totalPages)
                    )
                );
            }

            await interaction.reply({ embeds: [embed], components });
        }

        return;
    }

    if (interaction.isButton()) {
        // Keys
        if (interaction.customId === 'nextPage' || interaction.customId === 'prevPage') {
            const data = await readJsonFile(FILE_PATH_KEYS);
            const keysList = data.keys.map(k => ({ label: k.key, value: k.key }));
            const keysPerPage = 25;
            const totalPages = Math.ceil(keysList.length / keysPerPage);
            const currentPage = userPages[userId] ?? 1;

            userPages[userId] = interaction.customId === 'nextPage'
                ? Math.min(currentPage + 1, totalPages)
                : Math.max(currentPage - 1, 1);

            const keysPage = keysList.slice((userPages[userId] - 1) * keysPerPage, userPages[userId] * keysPerPage);

            let descricao = '';
            for (const k of keysPage) {
                const keyData = data.keys.find(key => key.key === k.value);
                if (keyData) {
                    const tempoRestante = await calcularTempoRestante(keyData.expiration, keyData.usedAt);
                    descricao += `🔑 \`${keyData.key}\`\nHWID: \`${keyData.hwid || 'Nenhum'}\` | Status: \`${keyData.status}\` | Expiração: \`${keyData.expiration}\` | Tempo restante: \`${tempoRestante}\`\n\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Gerenciamento de Keys')
                .setDescription(descricao || 'Nenhuma key cadastrada.')
                .setColor(0x0099ff);

            const components = [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('gerenciarKeysSelect')
                        .setPlaceholder('Selecione uma key para gerenciar')
                        .addOptions(keysPage)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('excluirKey').setLabel('Excluir').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('resetarKey').setLabel('Resetar HWID').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('excluirKeysExpiradas').setLabel('Excluir Keys Expiradas').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('excluirKeysUsadas').setLabel('Excluir Keys Usadas').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('excluirTodasKeys').setLabel('Excluir All Keys').setStyle(ButtonStyle.Danger),
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('atualizarkeys').setLabel('Atualizar').setStyle(ButtonStyle.Primary)

                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prevPage').setLabel('Página Anterior').setStyle(ButtonStyle.Primary).setDisabled(userPages[userId] <= 1),
                    new ButtonBuilder().setCustomId('nextPage').setLabel('Próxima Página').setStyle(ButtonStyle.Primary).setDisabled(userPages[userId] >= totalPages),

                )
            ];

            return await interaction.update({ embeds: [embed], components });
        }

        // Users
        if (interaction.customId === 'nextUserPage' || interaction.customId === 'prevUserPage') {
            const data = await readJsonFile(FILE_PATH_USERS);
            const usersList = data.users.map(u => ({ label: u.username, value: u.username }));
            const usersPerPage = 25;
            const totalPages = Math.ceil(usersList.length / usersPerPage);
            const currentPage = userUserPages[userId] ?? 1;

            userUserPages[userId] = interaction.customId === 'nextUserPage'
                ? Math.min(currentPage + 1, totalPages)
                : Math.max(currentPage - 1, 1);

            const usersPage = usersList.slice((userUserPages[userId] - 1) * usersPerPage, userUserPages[userId] * usersPerPage);

            let descricao = '';
            for (const u of usersPage) {
                const userData = data.users.find(user => user.username === u.value);
                if (userData) {
                    const tempoRestante = await calcularTempoRestante(userData.expiration, userData.usedAt);
                    descricao += `👤 \`${userData.username}\`\nHWID: \`${userData.hwid || 'Nenhum'}\` | Status: \`${userData.status}\` | Expiração: \`${userData.expiration}\` | Tempo restante: \`${tempoRestante}\`\n\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Gerenciamento de Usuários')
                .setDescription(descricao || 'Nenhum usuário cadastrado.')
                .setColor(0x0099ff);

            const components = [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('gerenciarUsersSelect')
                        .setPlaceholder('Selecione um usuário para gerenciar')
                        .addOptions(usersPage)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('excluirUser').setLabel('Excluir').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('resetarUser').setLabel('Resetar HWID').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('excluirUsuariosExpirados').setLabel('Excluir Users Expiradas').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('excluirTodosUsuarios').setLabel('Excluir All Users').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('atualizarusers').setLabel('Atualizar').setStyle(ButtonStyle.Primary)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prevUserPage').setLabel('Página Anterior').setStyle(ButtonStyle.Primary).setDisabled(userUserPages[userId] <= 1),
                    new ButtonBuilder().setCustomId('nextUserPage').setLabel('Próxima Página').setStyle(ButtonStyle.Primary).setDisabled(userUserPages[userId] >= totalPages)
                )
            ];

            return await interaction.update({ embeds: [embed], components });
        }
    }
});


// Mapeia interações por ID de usuário
const keySelecionadaPorUsuario = new Map();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'criarkey') {
        const keyInput = interaction.options.getString('key');
        const expiration = interaction.options.getString('expiracao');
        const quantidade = interaction.options.getInteger('quantidade') || 1;  // Padrão é 1 se não especificado
    
        // Verificar se o tempo de expiração é válido
        const expRegex = /^(?:\d+s|\d+m|\d+h|\d+d|vitalício)$/;
        if (!expRegex.test(expiration)) {
            return interaction.reply({ content: 'A expiração fornecida é inválida. Use um formato válido como: `1s`, `1m`, `1h`, `1d` ou `vitalício`.', ephemeral: true });
        }
    
        // Lê os dados do arquivo de keys
        const data = await readJsonFile(FILE_PATH_KEYS);
        const keysCriadas = [];
    
        if (keyInput.includes('*')) {
            // Se a chave contiver *, geramos várias keys
            for (let i = 0; i < quantidade; i++) {
                const newKey = generateKey(keyInput);
                // Verifica se a chave já existe
                if (data.keys.some(k => k.key === newKey)) {
                    i--; // Se já existir, tenta criar outra key
                    continue;
                }
                keysCriadas.push(newKey);
                data.keys.push({
                    key: newKey,
                    status: 'not_used',
                    hwid: '',
                    expiration,
                    createdAt: Date.now()
                });
            }
        } else {
            // Se não houver *, cria apenas uma key fixa
            const newKey = keyInput;
            // Verifica se a chave já existe
            if (data.keys.some(k => k.key === newKey)) {
                return interaction.reply({ content: 'Essa key já existe.', ephemeral: true });
            }
            data.keys.push({
                key: newKey,
                status: 'not_used',
                hwid: '',
                expiration,
                createdAt: Date.now()
            });
            keysCriadas.push(newKey);
        }
    
        // Salva os dados atualizados no arquivo
        await writeJsonFile(FILE_PATH_KEYS, data);
    
        // Verificando a quantidade e criando a embed adequada
        let embed;
        if (quantidade === 1) {
            // Se for 1 key, envia uma embed mais simples
            embed = new EmbedBuilder()
                .setColor('#00FF00')  // Cor verde
                .setDescription(`✅ key foi criada com sucesso`)
                .addFields(
                    { name: 'Key', value: keysCriadas[0], inline: true },
                    { name: 'Expiração', value: expiration, inline: true },
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Gerenciamento de Usuários' });
        } else {
            // Se for mais de 1 key, envia uma embed com a lista de todas as keys
            embed = new EmbedBuilder()
                .setColor('#00FF00')  // Cor verde
                .setDescription(`✅ ${quantidade} keys foram criadas com sucesso`)
                .addFields(
                    { name: 'Keys:', value: keysCriadas.join("\n"), inline: false },
                    { name: 'Expiração', value: expiration, inline: false },
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Gerenciamento de Usuários' });
        }
    
        // Enviando a resposta com o Embed
        return interaction.reply({ embeds: [embed] });
    }
    

    if (interaction.commandName === 'criaruser') {
        const username = interaction.options.getString('usuario');
        const password = interaction.options.getString('senha');
        const expiration = interaction.options.getString('expiracao');
    
        // Verificar se o tempo de expiração é válido
        const expRegex = /^(?:\d+s|\d+m|\d+h|\d+d|vitalício)$/;
        if (!expRegex.test(expiration)) {
            return interaction.reply({ content: 'A expiração fornecida é inválida. Use um formato válido como: `1s`, `1m`, `1h`, `1d` ou `vitalício`.', ephemeral: true });
        }
    
        const usersData = await readJsonFile(FILE_PATH_USERS);
        const userExists = usersData.users.some(u => u.username === username);
        if (userExists) return interaction.reply('❌ Este nome de usuário já existe!');
    
        const createdAt = Date.now();
        usersData.users.push({
            username, password, expiration, createdAt,
            hwid: '', key: 'N/A', status: 'not_used', usedAt: null
        });
    
        await writeJsonFile(FILE_PATH_USERS, usersData);
            // Criando o Embed
    const embed = new EmbedBuilder()
    .setColor('#00FF00')  // Cor verde
    .setTitle('✅ Usuário Criado')
    .setDescription(`O usuário \`${username}\` foi criado com sucesso!`)
    .addFields(
        { name: 'Expiração', value: expiration, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'Sistema de Gerenciamento de Usuários' });

// Enviando a resposta com o Embed
return interaction.reply({ embeds: [embed] });
    }
    

    let currentPage = 1;  // Variável que mantém a página atual
    if (interaction.commandName === 'deletarkey') {
        const key = interaction.options.getString('key');  // Obtém a chave do comando
    
        // Verifica se a chave foi fornecida
        if (!key) {
            return await interaction.reply({ content: 'Nenhuma chave fornecida.', ephemeral: true });
        }
    
        const data = await readJsonFile(FILE_PATH_KEYS);
        const newData = data.keys.filter(k => k.key !== key);
    
        // Verifica se a chave foi encontrada
        if (newData.length === data.keys.length) {
            return await interaction.reply({ content: `A chave \`${key}\` não foi encontrada.`, ephemeral: true });
        }
    
        await writeJsonFile(FILE_PATH_KEYS, { keys: newData });
    
        // Criando o Embed de sucesso
        const embed = new EmbedBuilder()
            .setColor('#FF0000')  // Cor vermelha
            .setTitle('❌ Key Excluída')
            .setDescription(`Key \`${key}\` foi excluída com sucesso! ✅`);
    
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    if (interaction.commandName === 'deletaruser') {
        const user = interaction.options.getString('user');  // Obtém o usuário do comando
    
        // Verifica se o usuário foi fornecido
        if (!user) {
            return await interaction.reply({ content: 'Nenhum usuário fornecido.', ephemeral: true });
        }
    
        const data = await readJsonFile(FILE_PATH_USERS);
        const newData = data.users.filter(u => u.username !== user);
    
        // Verifica se o usuário foi encontrado
        if (newData.length === data.users.length) {
            return await interaction.reply({ content: `O usuário \`${user}\` não foi encontrado.`, ephemeral: true });
        }
    
        await writeJsonFile(FILE_PATH_USERS, { users: newData });
    
        // Criando o Embed de sucesso
        const embed2 = new EmbedBuilder()
            .setColor('#FF0000')  // Cor vermelha
            .setTitle('❌ Usuário Excluído')
            .setDescription(`Usuário \`${user}\` excluído com sucesso! ✅`);
    
        await interaction.reply({ embeds: [embed2], ephemeral: true });
    }

    
}); 


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'resetarhwiduser') {
        const username = interaction.options.getString('user');

        const data = await readJsonFile(FILE_PATH_USERS);
        const userData = data.users.find(u => u.username === username);

        if (!userData) {
            return await interaction.reply({ content: '❌ Usuário não encontrado.', ephemeral: true });
        }

        userData.hwid = '';
        await writeJsonFile(FILE_PATH_USERS, data);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setDescription(`✅ HWID do usuário \`${username}\` resetado com sucesso.`);

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'resetarhwidkey') {
        const key = interaction.options.getString('key');

        const data = await readJsonFile(FILE_PATH_KEYS);
        const keyData = data.keys.find(k => k.key === key);

        if (!keyData) {
            return await interaction.reply({ content: '❌ Key não encontrada.', ephemeral: true });
        }

        keyData.hwid = '';
        await writeJsonFile(FILE_PATH_KEYS, data);

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setDescription(`✅ HWID da key \`${key}\` resetado com sucesso.`);

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
        
    if (interaction.commandName === 'infouser') {
        const username = interaction.options.getString('user');
        const data = await readJsonFile(FILE_PATH_USERS);
        const userData = data.users.find(u => u.username === username);
    
        if (!userData) {
            return await interaction.reply({ content: 'Usuário não encontrado.', ephemeral: true });
        }
    
        const tempoRestante = userData.usedAt
            ? await calcularTempoRestante(userData.expiration, userData.usedAt)
            : 'Não usada';
    
        const embed = new EmbedBuilder()
            .setTitle(`Informações do Usuário: ${userData.username}`)
            .addFields(
                { name: 'Status', value: `\`${userData.status}\``, inline: false },
                { name: 'Expiração', value: `\`${userData.expiration}\``, inline: false },
                { name: 'Tempo Restante', value: `\`${tempoRestante}\``, inline: false },
                { name: 'HWID', value: `\`${userData.hwid || 'Nenhum'}\``, inline: false },
                { name: 'Usada', value: userData.usedAt ? '✅ Sim' : '❌ Não', inline: false },
            )
            .setColor(0x00AE86);
    
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'infokey') {
        const key = interaction.options.getString('key');
        const data = await readJsonFile(FILE_PATH_KEYS);
        const keyData = data.keys.find(k => k.key === key);
    
        if (!keyData) {
            return await interaction.reply({ content: 'Key não encontrada.', ephemeral: true });
        }
    
        const tempoRestante = keyData.usedAt
            ? await calcularTempoRestante(keyData.expiration, keyData.usedAt)
            : 'Não usada';
    
        const embed = new EmbedBuilder()
            .setTitle(`Informações da Key: ${keyData.key}`)
            .addFields(
                { name: 'Status', value: `\`${keyData.status}\``, inline: false },
                { name: 'Expiração', value: `\`${keyData.expiration}\``, inline: false },
                { name: 'Tempo Restante', value: `\`${tempoRestante}\``, inline: false },
                { name: 'HWID', value: `\`${keyData.hwid || 'Nenhum'}\``, inline: false },
                { name: 'Usada', value: keyData.usedAt ? '✅ Sim' : '❌ Não', inline: false },
            )
            .setColor(0x00AE86);
    
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    

});



client.on('interactionCreate', async interaction => {
    if (interaction.isSelectMenu()) {
        if (interaction.customId === 'gerenciarKeysSelect') {
            const selectedKey = interaction.values[0];
            keySelecionadaPorUsuario.set(interaction.user.id, selectedKey);

                         // Criando o Embed
    const embed = new EmbedBuilder()
    .setColor('#00FF00')  // Cor verde
    .setDescription(`✅ Key \`${selectedKey}\` selecionada.`)

    return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.customId === 'gerenciarUsersSelect') {
            const selectedUser = interaction.values[0];
            keySelecionadaPorUsuario.set(interaction.user.id, selectedUser);

            

                                     // Criando o Embed
    const embed = new EmbedBuilder()
    .setColor('#00FF00')  // Cor verde
    .setDescription(`✅ Usuário \`${selectedUser}\` selecionado.`)

    return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    if (interaction.isButton()) {



        if (interaction.customId === 'excluirKey') {
            const selected = keySelecionadaPorUsuario.get(interaction.user.id); // Obtém a key selecionada
        
            // Verifica se a key foi selecionada
            if (!selected) {
                return await interaction.reply({ content: 'Nenhuma key selecionada.', ephemeral: true });
            }
        
            const data = await readJsonFile(FILE_PATH_KEYS);
            const newData = data.keys.filter(k => k.key !== selected);
            await writeJsonFile(FILE_PATH_KEYS, { keys: newData });
        
            // Atualiza a embed com a nova lista de keys
            await atualizarEmbedkeys(interaction, newData);
        
            // Criando o Embed de sucesso
            const embed = new EmbedBuilder()
                .setColor('#FF0000')  // Cor vermelha
                .setTitle('❌ Key Excluída')
                .setDescription(`Key \`${selected}\` foi excluída com sucesso! ✅`);
        
            // Se a interação já foi respondida, use followUp() em vez de reply()
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        
            // Apaga a key selecionada do mapa
            keySelecionadaPorUsuario.delete(interaction.user.id);
        }
        
        
        

        if (interaction.customId === 'excluirUser') {
            const selected = keySelecionadaPorUsuario.get(interaction.user.id); // Obtém a key selecionada

            // Verifica se a key foi selecionada
            if (!selected) {
                return await interaction.reply({ content: 'Nenhum User selecionada.', ephemeral: true });
            }
            const data = await readJsonFile(FILE_PATH_USERS);
            const newData = data.users.filter(u => u.username !== selected);
            await writeJsonFile(FILE_PATH_USERS, { users: newData });
            await atualizarEmbedUsers(interaction, newData);
            

                         // Criando o Embed
    const embed2 = new EmbedBuilder()
    .setColor('#FF0000')  // Cor verde
    .setTitle('❌ Usuário Excluido')
    .setDescription(`✅ Usuário \`${selected}\` excluído com sucesso. ✅`)

    await interaction.followUp({ embeds: [embed2] });
        

            
            keySelecionadaPorUsuario.delete(interaction.user.id);
        }
        

        if (interaction.customId === 'excluirKeysUsadas') {
            const data = await readJsonFile(FILE_PATH_KEYS);
        
            const now = Date.now();
        
            const newData = data.keys.filter(k => {
                if (k.status !== "used") return true;
                const usedAt = new Date(k.usedAt || k.createdAt || now).getTime();
                const durationMs = parseTempo(k.expiration);
                return (usedAt + durationMs) > now; // ainda não expirou
            });
        
            await writeJsonFile(FILE_PATH_KEYS, { keys: newData });
        
            await atualizarEmbedkeys(interaction, newData);
        


                                     // Criando o Embed
    const embed2 = new EmbedBuilder()
    .setColor('#00FF00')  // Cor verde
    .setDescription(`✅ Todas as keys usadas e expiradas foram excluídas com sucesso.`)

    await interaction.followUp({ embeds: [embed2] });
        }

        if (interaction.customId === 'excluirKeysExpiradas') {
            const data = await readJsonFile(FILE_PATH_KEYS);
        
            const now = Date.now();
        
            const parseExpiration = (expirationStr) => {
                const num = parseInt(expirationStr);
                if (expirationStr.endsWith("s")) return num * 1000;
                if (expirationStr.endsWith("m")) return num * 60 * 1000;
                if (expirationStr.endsWith("h")) return num * 60 * 60 * 1000;
                if (expirationStr.endsWith("d")) return num * 24 * 60 * 60 * 1000;
                return Infinity; // vitalício ou inválido
            };
        
            // Mantém apenas keys não expiradas OU que ainda não foram usadas
            const newData = data.keys.filter(k => {
                if (!k.usedAt) return true; // ainda não usada, não expira
                const tempo = parseExpiration(k.expiration);
                return k.usedAt + tempo > now;
            });
        
            await writeJsonFile(FILE_PATH_KEYS, { keys: newData });
        
            await atualizarEmbedkeys(interaction, newData);
        

                                                 // Criando o Embed
    const embed2 = new EmbedBuilder()
    .setColor('#00FF00')  // Cor verde
    .setDescription(`✅ Todas as keys expiradas foram excluídas com sucesso.`)

    await interaction.followUp({ embeds: [embed2] });
        }

        if (interaction.customId === 'excluirTodasKeys') {
            const newData = { keys: [] }; // Zera todas as keys
        
            await writeJsonFile(FILE_PATH_KEYS, newData);
        
            // Passando diretamente a lista de keys (newData.keys)
            await atualizarEmbedkeys(interaction, newData.keys);
        

                                                             // Criando o Embed
    const embed2 = new EmbedBuilder()
    .setColor('#00FF00')  // Cor verde
    .setDescription(`✅ Todas as keys foram excluídas com sucesso.`)

    await interaction.followUp({ embeds: [embed2] });
        }
        

        if (interaction.customId === 'excluirUsuariosExpirados') {
            const data = await readJsonFile(FILE_PATH_USERS);
        
            const now = Date.now();
        
            const parseExpiration = (expirationStr) => {
                const num = parseInt(expirationStr);
                if (expirationStr.endsWith("s")) return num * 1000;
                if (expirationStr.endsWith("m")) return num * 60 * 1000;
                if (expirationStr.endsWith("h")) return num * 60 * 60 * 1000;
                if (expirationStr.endsWith("d")) return num * 24 * 60 * 60 * 1000;
                return Infinity; // vitalício ou inválido
            };
        
            const newUsers = data.users.filter(user => {
                if (!user.usedAt) return true; // ainda não usado, não expira
                const tempo = parseExpiration(user.expiration);
                return user.usedAt + tempo > now;
            });
        
            await writeJsonFile(FILE_PATH_USERS, { users: newUsers });
        
            await atualizarEmbedUsers(interaction, newUsers);
        

            const embed2 = new EmbedBuilder()
            .setColor('#00FF00')  // Cor verde
            .setDescription(`✅ Todos os usuários expirados foram excluídos com sucesso.`)
        
            await interaction.followUp({ embeds: [embed2] });
        }
        
        

        if (interaction.customId === 'excluirTodosUsuarios') {
            const newUsers = []; // limpa a lista de usuários
        
            await writeJsonFile(FILE_PATH_USERS, { users: newUsers });
        
            await atualizarEmbedUsers(interaction, newUsers);
        

            const embed2 = new EmbedBuilder()
            .setColor('#00FF00')  // Cor verde
            .setDescription(`✅ Todos os usuários foram excluídos com sucesso.`)
        
            await interaction.followUp({ embeds: [embed2] });
        }
        
        
        if (interaction.customId === 'atualizarusers') {
            // Lê os dados de usuários
            const data = await readJsonFile(FILE_PATH_USERS);
        
            // Atualiza a embed de usuários com a lista atualizada
            await atualizarEmbedUsers(interaction, data.users);
        
            // Criando o Embed para indicar sucesso na atualização
            const embed = new EmbedBuilder()
                .setColor('#00FF00')  // Cor verde
                .setDescription('✅ A lista de usuários foi atualizada com sucesso.');
        
            // Responde ao usuário com a mensagem de sucesso
            await interaction.followUp({ embeds: [embed] });
        }

        if (interaction.customId === 'atualizarkeys') {
            // Lê os dados das keys
            const data = await readJsonFile(FILE_PATH_KEYS);
        
            // Atualiza a embed de keys com a lista atualizada
            await atualizarEmbedkeys(interaction, data.keys);
        
            // Criando o Embed para indicar sucesso na atualização
            const embed = new EmbedBuilder()
                .setColor('#00FF00')  // Cor verde
                .setDescription('✅ A lista de keys foi atualizada com sucesso.');
        
            // Responde ao usuário com a mensagem de sucesso
            await interaction.followUp({ embeds: [embed] });
        }




        // Função auxiliar para converter "1d", "2h", etc para milissegundos
function parseTempo(exp) {
    const regex = /^(\d+)([smhd])$/;
    const match = exp.match(regex);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
    }
}

async function atualizarEmbedkeys(interaction, keys) {
    const userId = interaction.user.id;

    // Se o usuário não tiver uma página armazenada, defina como 1
    if (!userPages[userId]) {
        userPages[userId] = 1;
    }

    const data = await readJsonFile(FILE_PATH_KEYS);
    const keysList = data.keys.map(k => ({
        label: k.key,
        value: k.key
    }));

    const keysPerPage = 25;  // Definir o número de keys por página
    const totalPages = Math.ceil(keysList.length / keysPerPage);  // Calcular o total de páginas
    const currentPage = userPages[userId];  // Página atual do usuário

    // Pegar as keys da página atual
    const keysPage = keysList.slice((currentPage - 1) * keysPerPage, currentPage * keysPerPage);

    let descricao = '';
    for (const k of keysPage) {
        // Encontrando o objeto completo da chave
        const keyData = data.keys.find(key => key.key === k.value);
        if (keyData) {
            const tempoRestante = await calcularTempoRestante(keyData.expiration, keyData.usedAt);
            descricao += `🔑 \`${keyData.key}\`\nHWID: \`${keyData.hwid || 'Nenhum'}\` | Status: \`${keyData.status}\` | Expiração: \`${keyData.expiration}\` | Tempo restante: \`${tempoRestante}\`\n\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('Gerenciamento de Keys')
        .setDescription(descricao || 'Nenhuma key cadastrada.')
        .setColor(0x0099ff);

    const components = [];

    if (data.keys.length > 0) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId('gerenciarKeysSelect')
            .setPlaceholder('Selecione uma key para gerenciar')
            .addOptions(keysPage);
// Adiciona o menu ao componente
components.push(new ActionRowBuilder().addComponents(menu));

// Primeira linha de botões (limite de 5 botões)
const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('excluirKey')
        .setLabel('Excluir')
        .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
        .setCustomId('resetarKey')
        .setLabel('Resetar HWID')
        .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
        .setCustomId('excluirKeysExpiradas')
        .setLabel('Excluir Keys Expiradas')
        .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
        .setCustomId('excluirKeysUsadas')
        .setLabel('Excluir Keys Usadas')
        .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
        .setCustomId('excluirTodasKeys')
        .setLabel('Excluir All Keys')
        .setStyle(ButtonStyle.Danger)
);

// Segunda linha de botões (com o botão "Atualizar")
const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('atualizarkeys')
        .setLabel('Atualizar')
        .setStyle(ButtonStyle.Primary)
);

// Adiciona as linhas de botões ao array de componentes
components.push(row1, row2);

        // Se houver mais de uma página, adicionar botões para navegação
        if (totalPages > 1) {
            const pageButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('nextPage')
                    .setLabel('Próxima Página')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= totalPages),  // Desabilitar se for a última página
                new ButtonBuilder()
                    .setCustomId('prevPage')
                    .setLabel('Página Anterior')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage <= 1)  // Desabilitar se for a primeira página
            );

            components.push(pageButtons);
        }
    }

    await interaction.update({
        embeds: [embed],
        components
    });
}




async function atualizarEmbedUsers(interaction, usersData) {
    const userId = interaction.user.id;

    if (!userPagesUsers[userId]) {
        userPagesUsers[userId] = 1;
    }

    const data = await readJsonFile(FILE_PATH_USERS);
    const usersList = data.users.map(u => ({
        label: u.username,
        value: u.username
    }));

    const usersPerPage = 25;
    const totalPages = Math.ceil(usersList.length / usersPerPage);
    const currentPage = userPagesUsers[userId];

    const usersPage = usersList.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    let descricao = '';
    for (const u of usersPage) {
        const userData = data.users.find(user => user.username === u.value);
        if (userData) {
            const tempoRestante = userData.usedAt
                ? await calcularTempoRestante(userData.expiration, userData.usedAt)
                : 'Não usada';
            descricao += `👤 \`${userData.username}\`\nHWID: \`${userData.hwid || 'Nenhum'}\` | Status: \`${userData.status}\` | Expiração: \`${userData.expiration}\` | Tempo restante: \`${tempoRestante}\`\n\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('Gerenciamento de Usuários')
        .setColor(0x0099ff)
        .setDescription(descricao || 'Nenhum usuário cadastrado.');

    const components = [];

    if (data.users.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('gerenciarUsersSelect')
            .setPlaceholder('Selecione um usuário para gerenciar')
            .addOptions(usersPage);

        const buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('excluirUser')
                .setLabel('Excluir')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('resetarUser')
                .setLabel('Resetar HWID')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('excluirUsuariosExpirados')
                .setLabel('Excluir Users Expirado')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('excluirTodosUsuarios')
                .setLabel('Excluir All Users')
                .setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('atualizarusers').setLabel('Atualizar').setStyle(ButtonStyle.Primary)
        );

        components.push(
            new ActionRowBuilder().addComponents(selectMenu),
            buttonsRow
        );

        if (totalPages > 1) {
            const pageButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prevUserPage')
                    .setLabel('Página Anterior')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage <= 1),
                new ButtonBuilder()
                    .setCustomId('nextUserPage')
                    .setLabel('Próxima Página')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= totalPages)
            );
            components.push(pageButtons);
        }
    }

    try {
        await interaction.update({
            embeds: [embed],
            components
        });
        console.log('Embed de usuários atualizado com sucesso!');
    } catch (err) {
        console.error('Erro ao atualizar embed de usuários:', err);
    }
}



        if (interaction.customId === 'resetarKey') {
            const selected = keySelecionadaPorUsuario.get(interaction.user.id); // Obtém a key selecionada

            // Verifica se a key foi selecionada
            if (!selected) {
                return await interaction.reply({ content: 'Nenhuma Key selecionada.', ephemeral: true });
            }
            const data = await readJsonFile(FILE_PATH_KEYS);
            const keyData = data.keys.find(k => k.key === selected);
            if (keyData) {
                keyData.hwid = '';  // Reseta HWID
                await writeJsonFile(FILE_PATH_KEYS, data);

                await atualizarEmbedkeys(interaction, data);

                const embed2 = new EmbedBuilder()
                .setColor('#00FF00')  // Cor verde
                .setDescription(`✅ HWID resetado para a key \`${selected}\`.`)
            
                await interaction.followUp({ embeds: [embed2] });

                keySelecionadaPorUsuario.delete(interaction.user.id);
            }
        }

        if (interaction.customId === 'resetarUser') {
            const selected = keySelecionadaPorUsuario.get(interaction.user.id); // Obtém a key selecionada

            // Verifica se a key foi selecionada
            if (!selected) {
                return await interaction.reply({ content: 'Nenhum User selecionada.', ephemeral: true });
            }
            const data = await readJsonFile(FILE_PATH_USERS);
            const userData = data.users.find(u => u.username === selected);
            if (userData) {
                userData.hwid = '';  // Reseta HWID
                await writeJsonFile(FILE_PATH_USERS, data);

                await atualizarEmbedUsers(interaction, data);

                const embed2 = new EmbedBuilder()
                .setColor('#00FF00')  // Cor verde
                .setDescription(`✅ HWID resetado para o usuário \`${selected}\`.`)
            
                await interaction.followUp({ embeds: [embed2] });

                keySelecionadaPorUsuario.delete(interaction.user.id);
            }
        }
    }
});

const userPagesUsers = {};

process.on('uncaughtException', (err) => {
    console.error('Erro não tratado:', err);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição de Promise não tratada:', reason);
  });
  
  client.on('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
  });
  
  client.on('messageCreate', (message) => {
    try {
      if (message.content === '!ping') {
        message.reply('Pong!');
      }
    } catch (error) {
      console.error('Erro no evento messageCreate:', error);
    }
  });

client.login(DISCORD_TOKEN);
