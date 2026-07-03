import type { UserRole } from '../types/auth'

export type RoleTheme = {
  headerGradient: string
  headerAccentText: string
  headerBadgeBorder: string
  headerBadgeBg: string
  headerBadgeText: string
  headerSignOutHover: string
  avatarGradient: string
  avatarLabel: string
  pageBg: string
  mainBg: string
  sidebarHeaderGradient: string
  sidebarLogoText: string
  sidebarBlurOrb: string
  sidebarBlurOrb2: string
  sidebarRoleAvatar: string
  sidebarLiveBadge: string
  sidebarActiveNav: string
  sidebarActiveAccent: string
  sidebarActiveSubtext: string
  sidebarActiveDot: string
  sidebarFooterBg: string
  sidebarFooterIcon: string
  heroGradient: string
  heroShadow: string
  heroPulse: string
  heroCtaText: string
  heroCtaHover: string
  sectionEyebrow: string
  sectionHeaderBg: string
  badgeSoft: string
  badgeSoftHover: string
  primaryBtn: string
  accentLink: string
  accentHover: string
  cardIndexBg: string
  referenceText: string
  highlightBg: string
  highlightText: string
  emptyIconBg: string
  emptyIconText: string
  mobileNavActive: string
  mobileNavActiveBg: string
  timelineGradient: string
  alertSectionBorder: string
  alertSectionBg: string
  alertIcon: string
  alertEyebrow: string
}

export const roleThemes: Record<UserRole, RoleTheme> = {
  citizen: {
    headerGradient: 'from-teal-700 via-emerald-700 to-emerald-800',
    headerAccentText: 'text-teal-200',
    headerBadgeBorder: 'border-teal-300/30',
    headerBadgeBg: 'bg-teal-400/15',
    headerBadgeText: 'text-teal-100',
    headerSignOutHover: 'hover:border-teal-300 hover:text-teal-100',
    avatarGradient: 'from-teal-400 to-emerald-500',
    avatarLabel: 'GP',
    pageBg: 'from-slate-100 via-slate-50 to-teal-50/30',
    mainBg: 'from-slate-100/80 via-white to-teal-50/20',
    sidebarHeaderGradient: 'from-teal-700 via-emerald-700 to-emerald-800',
    sidebarLogoText: 'text-teal-700',
    sidebarBlurOrb: 'bg-teal-400/15',
    sidebarBlurOrb2: 'bg-emerald-400/15',
    sidebarRoleAvatar: 'from-teal-400 to-emerald-500',
    sidebarLiveBadge: 'bg-emerald-100 text-emerald-700',
    sidebarActiveNav: 'from-teal-800 to-emerald-900',
    sidebarActiveAccent: 'from-emerald-300 to-teal-200',
    sidebarActiveSubtext: 'text-teal-100',
    sidebarActiveDot: 'bg-emerald-400',
    sidebarFooterBg: 'from-teal-50/50 to-emerald-50/50',
    sidebarFooterIcon: 'from-teal-500 to-emerald-600',
    heroGradient: 'from-teal-700 via-emerald-700 to-emerald-800',
    heroShadow: 'shadow-teal-700/25',
    heroPulse: 'bg-emerald-300',
    heroCtaText: 'text-teal-700',
    heroCtaHover: 'hover:bg-teal-50',
    sectionEyebrow: 'text-teal-700',
    sectionHeaderBg: 'from-teal-50/50 to-white',
    badgeSoft: 'bg-teal-50 text-teal-700',
    badgeSoftHover: 'hover:bg-teal-100',
    primaryBtn: 'from-teal-600 to-emerald-600',
    accentLink: 'text-teal-600',
    accentHover: 'hover:text-teal-700',
    cardIndexBg: 'from-teal-700 to-emerald-800',
    referenceText: 'text-teal-700',
    highlightBg: 'bg-teal-50',
    highlightText: 'text-teal-800',
    emptyIconBg: 'from-teal-100 to-emerald-100',
    emptyIconText: 'text-teal-600',
    mobileNavActive: 'text-teal-700',
    mobileNavActiveBg: 'bg-teal-100',
    timelineGradient: 'from-teal-400/30 via-emerald-400/30 to-transparent',
    alertSectionBorder: 'border-teal-200/80',
    alertSectionBg: 'from-teal-50 to-white',
    alertIcon: 'from-teal-500 to-emerald-600',
    alertEyebrow: 'text-teal-700',
  },
  staff: {
    headerGradient: 'from-primary via-primary-dark to-indigo-900',
    headerAccentText: 'text-blue-200',
    headerBadgeBorder: 'border-blue-300/30',
    headerBadgeBg: 'bg-blue-400/15',
    headerBadgeText: 'text-blue-100',
    headerSignOutHover: 'hover:border-blue-300 hover:text-blue-100',
    avatarGradient: 'from-blue-400 to-indigo-600',
    avatarLabel: 'ST',
    pageBg: 'from-slate-100 via-slate-50 to-blue-50/40',
    mainBg: 'from-slate-100/80 via-white to-blue-50/30',
    sidebarHeaderGradient: 'from-primary via-primary-dark to-indigo-900',
    sidebarLogoText: 'text-primary',
    sidebarBlurOrb: 'bg-primary/10',
    sidebarBlurOrb2: 'bg-indigo-400/10',
    sidebarRoleAvatar: 'from-blue-400 to-indigo-600',
    sidebarLiveBadge: 'bg-blue-100 text-blue-700',
    sidebarActiveNav: 'from-primary-dark to-indigo-900',
    sidebarActiveAccent: 'from-blue-300 to-indigo-300',
    sidebarActiveSubtext: 'text-blue-100',
    sidebarActiveDot: 'bg-blue-400',
    sidebarFooterBg: 'from-slate-50 to-blue-50/50',
    sidebarFooterIcon: 'from-primary to-indigo-600',
    heroGradient: 'from-primary via-primary-dark to-indigo-900',
    heroShadow: 'shadow-primary/25',
    heroPulse: 'bg-blue-300',
    heroCtaText: 'text-primary',
    heroCtaHover: 'hover:bg-blue-50',
    sectionEyebrow: 'text-primary',
    sectionHeaderBg: 'from-blue-50/50 to-white',
    badgeSoft: 'bg-primary/10 text-primary',
    badgeSoftHover: 'hover:bg-primary/15',
    primaryBtn: 'from-primary to-primary-light',
    accentLink: 'text-primary',
    accentHover: 'hover:text-primary-dark',
    cardIndexBg: 'from-primary-dark to-indigo-900',
    referenceText: 'text-primary',
    highlightBg: 'bg-blue-50',
    highlightText: 'text-blue-800',
    emptyIconBg: 'from-blue-100 to-indigo-100',
    emptyIconText: 'text-primary',
    mobileNavActive: 'text-primary',
    mobileNavActiveBg: 'bg-blue-100',
    timelineGradient: 'from-primary/30 via-indigo-400/30 to-transparent',
    alertSectionBorder: 'border-blue-200/80',
    alertSectionBg: 'from-blue-50 to-white',
    alertIcon: 'from-primary to-indigo-600',
    alertEyebrow: 'text-primary',
  },
  leader: {
    headerGradient: 'from-violet-400 via-purple-400 to-indigo-500',
    headerAccentText: 'text-violet-100',
    headerBadgeBorder: 'border-violet-200/35',
    headerBadgeBg: 'bg-violet-300/20',
    headerBadgeText: 'text-violet-50',
    headerSignOutHover: 'hover:border-violet-200 hover:text-violet-50',
    avatarGradient: 'from-violet-300 to-indigo-400',
    avatarLabel: 'LD',
    pageBg: 'from-slate-100 via-slate-50 to-violet-50/30',
    mainBg: 'from-slate-100/80 via-white to-violet-50/20',
    sidebarHeaderGradient: 'from-violet-400 via-purple-400 to-indigo-500',
    sidebarLogoText: 'text-violet-600',
    sidebarBlurOrb: 'bg-violet-400/15',
    sidebarBlurOrb2: 'bg-indigo-400/15',
    sidebarRoleAvatar: 'from-violet-300 to-indigo-400',
    sidebarLiveBadge: 'bg-violet-100 text-violet-700',
    sidebarActiveNav: 'from-violet-600 to-indigo-800',
    sidebarActiveAccent: 'from-violet-300 to-purple-200',
    sidebarActiveSubtext: 'text-violet-100',
    sidebarActiveDot: 'bg-violet-400',
    sidebarFooterBg: 'from-violet-50/50 to-indigo-50/50',
    sidebarFooterIcon: 'from-violet-400 to-indigo-500',
    heroGradient: 'from-violet-400 via-purple-400 to-indigo-500',
    heroShadow: 'shadow-violet-400/25',
    heroPulse: 'bg-violet-300',
    heroCtaText: 'text-violet-700',
    heroCtaHover: 'hover:bg-violet-50',
    sectionEyebrow: 'text-violet-600',
    sectionHeaderBg: 'from-violet-50/50 to-white',
    badgeSoft: 'bg-violet-100 text-violet-700',
    badgeSoftHover: 'hover:bg-violet-200',
    primaryBtn: 'from-violet-500 to-indigo-500',
    accentLink: 'text-violet-600',
    accentHover: 'hover:text-violet-800',
    cardIndexBg: 'from-violet-600 to-indigo-800',
    referenceText: 'text-violet-700',
    highlightBg: 'bg-violet-50',
    highlightText: 'text-violet-800',
    emptyIconBg: 'from-violet-100 to-indigo-100',
    emptyIconText: 'text-violet-600',
    mobileNavActive: 'text-violet-700',
    mobileNavActiveBg: 'bg-violet-100',
    timelineGradient: 'from-violet-400/30 via-purple-400/30 to-transparent',
    alertSectionBorder: 'border-violet-200/80',
    alertSectionBg: 'from-violet-50 to-white',
    alertIcon: 'from-violet-400 to-indigo-500',
    alertEyebrow: 'text-violet-600',
  },
}

export function getRoleTheme(role: UserRole): RoleTheme {
  return roleThemes[role]
}
