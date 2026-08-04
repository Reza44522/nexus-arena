/**
 * Aparat live-stream configuration.
 */
export const streamConfig = {
  channelName: 'MafiaGANG',
  aparatUsername: 'MafiaGANG',
  defaultStatus: 'online',
  streamTitle: 'استریم زنده — MafiaGANG',
  streamCategory: 'گیمینگ',
};

/**
 * ساخت URL رسمی embed لایو آپارات
 */
export function getAparatEmbedUrl(username) {
  return `https://www.aparat.com/embed/live/${username}`;
}