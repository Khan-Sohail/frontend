export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
    // No permission required - everyone can see home
  },
  {
    title: 'Super Admin Dashboard',
    to: { name: 'super-admin-dashboard' },
    icon: { icon: 'tabler-dashboard' },
    requiredRole: 'SUPER ADMIN',
  },
  {
    title: 'Analytics',
    to: { name: 'analytics' },
    icon: { icon: 'tabler-chart-dots' },
    permission: 'ANALYTICS.VIEW',
  },
  {
    title: 'Companies',
    to: { name: 'company' },
    icon: { icon: 'tabler-building' },
    requiredRole: 'SUPER ADMIN',
  },
  {
    title: 'Users',
    to: { name: 'users' },
    icon: { icon: 'tabler-users' },
    permission: 'USERS.VIEW',
  },
  {
    title: 'Admins',
    to: { name: 'users-admin' },
    icon: { icon: 'tabler-shield-check' },
    requiredRole: 'SUPER ADMIN',
  },
  {
    title: 'Points',
    to: { name: 'points' },
    icon: { icon: 'tabler-trophy' },
    permission: 'POINTS.VIEW',
  },
  {
    title: 'User Points',
    to: { name: 'user-points' },
    icon: { icon: 'tabler-star' },
    permission: 'USER_POINTS.VIEW',
  },
  {
    title: 'Content Management',
    icon: { icon: 'tabler-books' },
    // Parent shown if user has permission to any child
    children: [
      {
        title: 'Subjects',
        to: { name: 'subjects' },
        icon: { icon: 'tabler-book' },
        permission: 'SUBJECTS.VIEW',
      },
      {
        title: 'Grades',
        to: { name: 'grades' },
        icon: { icon: 'tabler-school' },
        permission: 'GRADES.VIEW',
      },
      {
        title: 'Categories',
        to: { name: 'categories' },
        icon: { icon: 'tabler-category' },
        permission: 'CATEGORIES.VIEW',
      },
    ],
  },
  {
    title: 'School Management',
    icon: { icon: 'tabler-school' },
    // Parent shown if user has permission to any child
    children: [
      {
        title: 'Schools',
        to: { name: 'schools' },
        icon: { icon: 'tabler-building-bank' },
        permission: 'SCHOOLS.VIEW',
      },
      {
        title: 'Teachers',
        to: { name: 'teachers' },
        icon: { icon: 'tabler-user-check' },
        permission: 'TEACHERS.VIEW',
      },
      {
        title: 'Students',
        to: { name: 'students' },
        icon: { icon: 'tabler-users-group' },
        permission: 'STUDENTS.VIEW',
      },
    ],
  },
  {
    title: 'Masters',
    icon: { icon: 'tabler-settings' },
    // Parent shown if user has permission to any child
    children: [
      {
        title: 'Positions',
        to: { name: 'positions' },
        icon: { icon: 'tabler-briefcase' },
        permission: 'POSITIONS.VIEW',
      },
      {
        title: 'Modules',
        to: { name: 'modules' },
        icon: { icon: 'tabler-components' },
        permission: 'MODULES.VIEW',
      },
      {
        title: 'Permissions',
        to: { name: 'permissions' },
        icon: { icon: 'tabler-lock' },
        permission: 'PERMISSIONS.VIEW',
      },
      {
        title: 'Values',
        to: { name: 'values' },
        icon: { icon: 'tabler-list-details' },
        permission: 'VALUES.VIEW',
      },
    ],
  },
]
