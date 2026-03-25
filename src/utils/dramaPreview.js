const PREVIEW_MAP = {
  '余生为期': '余生为期.mp3',
  '谢相': '谢相.mp3',
  '你我相爱，为民除害': '你我相爱，为民除害.mp3',
  '余情可待[重生]': '余情可待.mp3',
  '我亲爱的法医小姐': '我亲爱的法医小姐.mp3',
  '她属于我': '她属于我.mp3',
  '总有老师要请家长': '总有老师要请家长.mp3',
  '放肆[娱乐圈]': '放肆.mp3',
  '打卦': '打卦.mp3',
  '入迷': '入迷.mp3',
  '她的山，她的海': '她的山，她的海.mp3',
  '宝石商人和钻石小姐': '宝石商人和钻石小姐.mp3',
  '请嗑我和总监的cp': '请嗑我和总监的cp.mp3',
  '距离': '距离.mp3',
  '全世界都在等你心动': '全世界都在等你心动.mp3',
  '冰川渐暖': '冰川渐暖.mp3',
  '今宵酒醒[重生]': '今宵酒醒.mp3',
  '病美人师尊的千层套路': '病师尊美人的千层套路.mp3',
  '喂，我们闪婚吧': '喂，我们闪婚吧.mp3',
  '今日离港': '今日离港.mp3',
  '我系统，我老婆风傲天': '我系统，我老婆风傲天.mp3',
  '暗瘾（娱乐圈）': '暗瘾.mp3',
  '问棺': '问棺.mp3',
  '烧': '烧.mp3',
  '美色撩人': '美色撩人.mp3',
  '都什么年代了啊': '都什么年代了啊.mp3',
  '帮我拍拍': '帮我拍拍.mp3',
  '晚潮': '晚潮.mp3',
  '月光照不到': '月光照不到.mp3',
  '神龛': '神龛.mp3',
  '飘飘': '飘飘.mp3',
  '希望你，真的很快乐': '希望你，真的很快乐.mp3',
  '我比你危险': '我比你危险.mp3',
  '相思令': '相思令.mp3',
  '上阳春': '上阳春.mp3',
  '爱呢？在白云之上': '爱呢，在白云之上.mp3',
};

export function getDramaPreview(title, cvs) {
  // 探虚陵现代篇 special case: two versions
  if (title === '探虚陵现代篇') {
    if (cvs && cvs.includes('季冠霖')) return `${process.env.PUBLIC_URL}/audio-preview/${encodeURIComponent('探虚陵1.mp3')}`;
    if (cvs && cvs.includes('风镜')) return `${process.env.PUBLIC_URL}/audio-preview/${encodeURIComponent('探虚陵2.mp3')}`;
    return null;
  }
  const file = PREVIEW_MAP[title];
  if (!file) return null;
  return `${process.env.PUBLIC_URL}/audio-preview/${encodeURIComponent(file)}`;
}
