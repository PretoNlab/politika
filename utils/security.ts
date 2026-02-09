/**
 * Utilitários de segurança para sanitização e validação de inputs
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param text - Texto a ser escapado
 * @returns Texto com caracteres HTML escapados
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Remove tags HTML de uma string
 * @param html - String com HTML
 * @returns String sem tags HTML
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Sanitiza input do usuário removendo caracteres potencialmente perigosos
 * @param input - Input do usuário
 * @param options - Opções de sanitização
 * @returns Input sanitizado
 */
export const sanitizeInput = (
  input: string,
  options: {
    maxLength?: number;
    allowNewlines?: boolean;
    allowSpecialChars?: boolean;
  } = {}
): string => {
  const { maxLength = 5000, allowNewlines = true, allowSpecialChars = true } = options;

  let sanitized = input.trim();

  // Limita o tamanho
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Remove quebras de linha se não permitido
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Remove caracteres especiais perigosos se não permitido
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
  }

  return sanitized;
};

/**
 * Detecta possíveis tentativas de prompt injection
 * @param input - Input do usuário
 * @returns true se detectar tentativa de injection
 */
export const detectPromptInjection = (input: string): boolean => {
  const suspiciousPatterns = [
    // Tentativas de quebrar o contexto
    /ignore\s+(previous|all|above)\s+(instructions|prompts?|commands?)/i,
    /forget\s+(everything|all|previous)/i,
    /disregard\s+(previous|all)\s+/i,

    // Tentativas de roleplay/jailbreak
    /you\s+are\s+now\s+(a|an|the)/i,
    /pretend\s+(you|to\s+be)/i,
    /act\s+as\s+(if|a|an)/i,
    /roleplay\s+as/i,

    // Tentativas de extrair informações do sistema
    /system\s+(prompt|instruction|message)/i,
    /show\s+me\s+your\s+(prompt|instructions|system)/i,
    /what\s+(is|are)\s+your\s+(instructions|rules|guidelines)/i,

    // Tentativas de injeção de código
    /<script[^>]*>[\s\S]*?<\/script>/i,
    /javascript:/i,
    /on(load|error|click|mouseover)\s*=/i,

    // Marcadores suspeitos
    /```\s*(system|assistant|user)\s*:/i,
    /<\|.*?\|>/,
    /\[INST\]|\[\/INST\]/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Valida se o input contém apenas caracteres permitidos
 * @param input - Input do usuário
 * @param allowedPattern - Padrão regex de caracteres permitidos
 * @returns true se válido
 */
export const validateInput = (input: string, allowedPattern: RegExp): boolean => {
  return allowedPattern.test(input);
};

/**
 * Sanitiza handle/username (remove caracteres não alfanuméricos exceto _ e -)
 * @param handle - Handle do usuário
 * @returns Handle sanitizado
 */
export const sanitizeHandle = (handle: string): string => {
  return handle
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 50); // Máximo 50 caracteres
};

/**
 * Valida URL para prevenir javascript: e data: URIs
 * @param url - URL a ser validada
 * @returns true se URL é segura
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Permite apenas http e https
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitiza texto para uso em JSON (escape de aspas e barras)
 * @param text - Texto a ser sanitizado
 * @returns Texto sanitizado para JSON
 */
export const sanitizeForJson = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

/**
 * Valida tamanho de arquivo
 * @param size - Tamanho em bytes
 * @param maxSizeMB - Tamanho máximo em MB
 * @returns true se válido
 */
export const isValidFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxBytes;
};

/**
 * Valida tipo MIME de arquivo
 * @param mimeType - Tipo MIME
 * @param allowedTypes - Lista de tipos permitidos
 * @returns true se válido
 */
export const isValidMimeType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimeType.toLowerCase());
};

/**
 * Sanitiza nome de arquivo
 * @param filename - Nome do arquivo
 * @returns Nome sanitizado
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
};
