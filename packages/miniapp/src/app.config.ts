export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/post-detail/index',
    'pages/gallery/index',
    'pages/points/index',
    'pages/profile/index',
    'pages/events/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0a0e27',
    navigationBarTitleText: '太空猎人',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0e27',
  },
  tabBar: {
    color: '#6b7280',
    selectedColor: '#818cf8',
    backgroundColor: '#0f1333',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tab-home.png',
        selectedIconPath: 'assets/tab-home-active.png',
      },
      {
        pagePath: 'pages/gallery/index',
        text: '画廊',
        iconPath: 'assets/tab-gallery.png',
        selectedIconPath: 'assets/tab-gallery-active.png',
      },
      {
        pagePath: 'pages/events/index',
        text: '活动',
        iconPath: 'assets/tab-events.png',
        selectedIconPath: 'assets/tab-events-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tab-profile.png',
        selectedIconPath: 'assets/tab-profile-active.png',
      },
    ],
  },
})
