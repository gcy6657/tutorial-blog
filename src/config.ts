// 网站的文字和链接都在这里改，改完保存，所有页面会一起更新。
export const SITE = {
  // 博客名称：显示在每页左上角、浏览器标签页上
  title: '红苹果的教程',
  // 首页大标题
  heading: '开源，共享',
  // 首页大标题下面的一句话
  description: '经验分享。',
  // 你的名字：显示在页面底部「© 年份 名字」和关于页
  author: '红苹果',
  lang: 'zh-CN',
  // 页面底部的链接，想加就照格式多写一行，例如 { label: '邮箱', href: 'mailto:xxx@xx.com' }
  social: [
    { label: '邮箱', href: 'mailto:2114538625@qq.com' },
  ] as { label: string; href: string }[],
};

// 评论系统：到 https://giscus.app 生成配置后填入。repoId 为空时不渲染评论区。
export const GISCUS = {
  repo: '' as `${string}/${string}` | '',
  repoId: '',
  category: 'Announcements',
  categoryId: '',
  mapping: 'pathname',
  lang: 'zh-CN',
};
