// ====================================================================================
// CONFIGURAÇÃO CHAVE DO PROJETO (SITE DE PEDIDOS)
// ⚠️ SUBSTITUA OS PLACEHOLDERS PELOS SEUS VALORES REAIS DO GOOGLE FORMS ⚠️
// ====================================================================================
// URL de Ação (JÁ COMPLETO)
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLScnL18rvuEb9bshVPOWLatAY7llz8fCkWnz1APrcwmGcKGjEw/formResponse"; 

// 2. Mapeamento DOS IDS ENCONTRADOS (JÁ COMPLETO)
const FORM_ENTRY_IDS = {
    TIPO_APOIO: 'entry.1944720991', 
    LOCALIZACAO: 'entry.1072432796',
    MOTIVO: 'entry.549038910', 
    TELEFONE: 'entry.111803321', 
    DEFICIENCIA: 'entry.308908157', 
    DETALHES_DEFICIENCIA: 'entry.22088114',
    AUDIO_FLAG: 'entry.512796803' 
};
// ====================================================================================

const step1 = document.getElementById('step1');
const helpForm = document.getElementById('helpForm');
const backToStep1Btn = document.getElementById('back-to-step1');
const optionBtns = document.querySelectorAll('.option-btn');
const tipoApoioInput = document.getElementById('tipoApoio');
const tipoApoioDisplay = document.getElementById('tipoApoioDisplay');
const getLocationBtn = document.getElementById('getLocationBtn');
const localizacaoTextarea = document.getElementById('localizacao');
const deficienciaSim = document.getElementById('deficienciaSim');
const deficienciaNao = document.getElementById('deficienciaNao');
const deficienciaDetalhes = document.getElementById('deficienciaDetalhes');
const outrasDeficiencia = document.getElementById('deficienciaOutras');
const outrasDeficienciaText = document.getElementById('outrasDeficienciaText');
const form = document.getElementById('helpForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const headerLogo = document.getElementById('headerLogo');

const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const deleteButton = document.getElementById('deleteButton');
const audioStatus = document.getElementById('audioStatus');
const audioPlayerContainer = document.querySelector('.audio-player-container');
const audioPlayer = document.getElementById('audioPlayer');

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

// --- FUNÇÕES DE INICIALIZAÇÃO E UTILITÁRIOS (LOGOTIPO) ---

function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const companyLogoUrl = getUrlParameter('logo');
if (companyLogoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = companyLogoUrl; logoImg.alt = "Logo da Empresa"; logoImg.classList.add('header-logo');
    headerLogo.appendChild(logoImg);
} else {
    const logoImg = document.createElement('img');
    logoImg.src = "https://i.ibb.co/C07pT0/logo-helpcode.png"; logoImg.alt = "HelpCode Logo"; logoImg.classList.add('header-logo');
    headerLogo.appendChild(logoImg);
}

// --- EVENT LISTENERS DE NAVEGAÇÃO E LÓGICA (CORRIGIDO) ---

// 1. Avançar para o formulário (Passo 1 -> Formulário)
optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tipoApoioInput.value = btn.dataset.value; tipoApoioDisplay.value = btn.textContent;
        step1.classList.add('hidden'); 
        helpForm.classList.remove('hidden'); 
    });
});

// 2. Voltar ao Passo 1 (Botão <- Voltar)
backToStep1Btn.addEventListener('click', () => {
    helpForm.classList.add('hidden'); 
    step1.classList.remove('hidden'); 
});

// 3. Lógica de Deficiência
deficienciaSim.addEventListener('change', () => deficienciaDetalhes.classList.remove('hidden'));
deficienciaNao.addEventListener('change', () => deficienciaDetalhes.classList.add('hidden'));
outrasDeficiencia.addEventListener('change', () => outrasDeficienciaText.classList.toggle('hidden', !outrasDeficiencia.checked));

// 4. Lógica de Geolocalização
getLocationBtn.addEventListener('click', () => {
    localizacaoTextarea.value = "Obtendo localização...";
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => localizacaoTextarea.value = `Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}`);
    } else { localizacaoTextarea.value = "Geolocalização não suportada."; }
});

// --- Lógica de Áudio ---

recordButton.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream); audioChunks = [];
    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.onstop = () => { audioBlob = new Blob(audioChunks); audioStatus.textContent = 'Áudio gravado. Você pode ouvir ou apagar.'; recordButton.disabled = true; stopButton.disabled = true; deleteButton.disabled = false; audioPlayer.src = URL.createObjectURL(audioBlob); audioPlayerContainer.classList.remove('hidden'); stream.getTracks().forEach(track => track.stop()); };
    mediaRecorder.start(); audioStatus.textContent = 'Gravando...'; recordButton.disabled = true; stopButton.disabled = false; deleteButton.disabled = true;
});
stopButton.addEventListener('click', () => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); });
deleteButton.addEventListener('click', () => {
    audioBlob = null; audioStatus.textContent = ''; audioPlayer.src = ''; audioPlayerContainer.classList.add('hidden');
    recordButton.disabled = false; deleteButton.disabled = true; stopButton.disabled = true;
});

// --- Lógica de Submissão para Google Forms (CORRIGIDO PARA USAR IFRAME) ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Cria um formulário temporário que será submetido no iframe
    const tempForm = document.createElement('form');
    tempForm.action = GOOGLE_FORM_ACTION_URL;
    tempForm.method = 'POST';
    tempForm.target = 'googleFormsIframe'; // Aponta para o iframe
    tempForm.style.display = 'none';

    // Função auxiliar para criar inputs hidden
    const addHiddenInput = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        tempForm.appendChild(input);
    };

    // 2. Adiciona todos os dados ao formulário temporário
    addHiddenInput(FORM_ENTRY_IDS.TIPO_APOIO, tipoApoioInput.value);
    addHiddenInput(FORM_ENTRY_IDS.LOCALIZACAO, localizacaoTextarea.value);
    addHiddenInput(FORM_ENTRY_IDS.MOTIVO, form.motivo.value);
    addHiddenInput(FORM_ENTRY_IDS.TELEFONE, form.telefone.value);
    
    // Deficiência
    const deficiencia = deficienciaSim.checked ? 'Sim' : 'Não';
    addHiddenInput(FORM_ENTRY_IDS.DEFICIENCIA, deficiencia);

    // Detalhes da Deficiência
    let defs = [];
    if (deficienciaSim.checked) {
        defs = Array.from(document.querySelectorAll('input[name="deficienciaDetalhe"]:checked')).map(cb => cb.value);
        // Verificar se o campo de texto 'outrasDeficiencia' existe antes de tentar acessar seu valor
        const outrasDeficienciaInput = document.getElementById('outrasDeficiencia');
        if (outrasDeficienciaInput && outrasDeficienciaInput.value) {
            defs.push(`Outras: ${outrasDeficienciaInput.value}`);
        }
    } else {
        defs.push('Nenhuma');
    }
    addHiddenInput(FORM_ENTRY_IDS.DETALHES_DEFICIENCIA, defs.join(', '));

    // Flag de Áudio
    const audioFlag = audioBlob ? 'ÁUDIO GRAVADO COM SUCESSO' : 'NÃO GRAVADO';
    addHiddenInput(FORM_ENTRY_IDS.AUDIO_FLAG, audioFlag);
    
    // 3. Submete o formulário através do iframe
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm); // Remove o formulário temporário

    // 4. Exibe a mensagem de sucesso e limpa o formulário
    confirmationMessage.textContent = 'Seu pedido foi enviado com sucesso!';
    confirmationMessage.className = 'success';
    confirmationMessage.classList.remove('hidden');
    
    form.reset();
    window.dispatchEvent(new Event('storage-update')); 
    
    // Limpar o áudio
    if (audioBlob) {
        audioBlob = null; audioStatus.textContent = ''; audioPlayer.src = ''; audioPlayerContainer.classList.add('hidden');
        recordButton.disabled = false; deleteButton.disabled = true; stopButton.disabled = true;
    }
    
    // Opcional: Volta ao passo 1 após um pequeno atraso
    setTimeout(() => {
        helpForm.classList.add('hidden'); 
        step1.classList.remove('hidden'); 
        confirmationMessage.classList.add('hidden'); 
    }, 5000);
});