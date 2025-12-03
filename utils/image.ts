export const getRealImageUrl = (query: string, type: 'photo' | 'logo' = 'photo') => {
  // Bing Thumbnail Service (standard for AI demos to get real imagery without custom search API keys)
  const encoded = encodeURIComponent(query + (type === 'logo' ? ' football club logo transparent' : ' football player profile'));
  
  const width = type === 'logo' ? 200 : 800;
  const height = type === 'logo' ? 200 : 600;
  
  return `https://tse2.mm.bing.net/th?q=${encoded}&w=${width}&h=${height}&c=7&rs=1&p=0&dpr=2&pid=1.7&mkt=en-US&adlt=moderate`;
};

export const getFallbackImage = (type: 'photo' | 'logo') => {
  if (type === 'logo') return "https://cdn-icons-png.flaticon.com/512/1165/1165187.png";
  return "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=800";
};