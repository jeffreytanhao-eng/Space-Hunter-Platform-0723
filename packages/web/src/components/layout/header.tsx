'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar } from '@/components/ui/avatar'
import { Search, ChevronDown, LogOut, User, Coins, Menu, X } from 'lucide-react'

/* 顶部导航栏 */
export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* 点击外部关闭下拉菜单 */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      window.location.href = `/?keyword=${encodeURIComponent(searchValue.trim())}`
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-space-600 bg-space-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-neon-blue text-glow-blue">太空猎人</span>
          </Link>
          {/* 桌面端导航 */}
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/" className="text-star-dim hover:text-star-white transition-colors">首页</Link>
            <Link href="/gallery" className="text-star-dim hover:text-star-white transition-colors">画廊</Link>
            <Link href="/events" className="text-star-dim hover:text-star-white transition-colors">活动</Link>
            <Link href="/points" className="text-star-dim hover:text-star-white transition-colors">积分</Link>
          </nav>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="mx-4 hidden max-w-xs flex-1 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-dim" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索帖子、标签..."
              className="w-full rounded-lg border border-space-600 bg-space-800 py-1.5 pl-9 pr-3 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-colors"
            />
          </div>
        </form>

        {/* 用户区域 */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-space-700 transition-colors"
              >
                <Avatar src={user.avatar} alt={user.nickname} size="sm" />
                <span className="hidden text-sm text-star-white sm:inline">{user.nickname}</span>
                <ChevronDown className="h-4 w-4 text-star-dim" />
              </button>
              {/* 下拉菜单 */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border-glow-blue bg-space-800 py-1 shadow-xl">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User className="h-4 w-4" />
                    个人中心
                  </Link>
                  <Link
                    href="/points"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Coins className="h-4 w-4" />
                    积分中心
                  </Link>
                  <div className="my-1 border-t border-space-600" />
                  <button
                    onClick={() => {
                      logout()
                      setShowDropdown(false)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm text-star-dim hover:text-star-white transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-neon-blue/10 px-3 py-1.5 text-sm text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-colors"
              >
                注册
              </Link>
            </div>
          )}

          {/* 移动端菜单按钮 */}
          <button
            className="ml-2 text-star-dim hover:text-star-white md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {showMobileMenu && (
        <div className="border-t border-space-600 bg-space-800 px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-dim" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索帖子、标签..."
                className="w-full rounded-lg border border-space-600 bg-space-700 py-2 pl-9 pr-3 text-sm text-star-white placeholder:text-star-dim/60 focus:border-neon-blue/50 focus:outline-none"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            <Link href="/" className="rounded-lg px-3 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white" onClick={() => setShowMobileMenu(false)}>首页</Link>
            <Link href="/gallery" className="rounded-lg px-3 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white" onClick={() => setShowMobileMenu(false)}>画廊</Link>
            <Link href="/events" className="rounded-lg px-3 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white" onClick={() => setShowMobileMenu(false)}>活动</Link>
            <Link href="/points" className="rounded-lg px-3 py-2 text-sm text-star-dim hover:bg-space-700 hover:text-star-white" onClick={() => setShowMobileMenu(false)}>积分</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
