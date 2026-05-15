import { redirect } from 'next/navigation';

export default function TasksRedirectPage() {
  redirect('/maintenance-schedules?tab=tasks');
}
