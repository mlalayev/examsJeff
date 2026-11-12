import { getStaffNavSections } from '@/components/dashboard/nav/staffNavConfig';
test.each(['CREATOR', 'BOSS', 'ADMIN'])('%s has one Users group, named CRM stages and the register', role => {
  const sections = getStaffNavSections(role);
  const users = sections.filter(s => s.label === 'Users');
  expect(users).toHaveLength(1);
  expect(users[0].subs.map(s => s.label)).toEqual(['All users', 'Parents', 'Partners', 'Active students', 'Alumni', 'Sunday examiners', 'Archive']);
  expect(sections.find(s => s.label === 'CRM')!.subs.map(s => s.label)).toEqual(['All contacts', 'New inquiry', 'Consultation booked', 'Attended trial lesson', 'Joined classes']);
  expect(sections.flatMap(s => s.subs).some(s => s.href === '/dashboard/student-register')).toBe(true);
});
test('teachers can open the register without gaining access to management menus', () => {
  const sections = getStaffNavSections('TEACHER');
  expect(sections.flatMap(s => s.subs).some(s => s.href === '/dashboard/student-register')).toBe(true);
  expect(sections.some(s => s.label === 'Users')).toBe(false);
});
