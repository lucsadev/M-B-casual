/**
 * Profile tab route — renders the ProfileScreen.
 *
 * When the user is not authenticated, the ProfileScreen shows a
 * prompt to log in. When authenticated, it shows the full profile
 * with editable fields and order history.
 */
import { useAuth } from '../../features/auth/context/AuthContext';
import ProfileScreen from '../../features/auth/screens/ProfileScreen';

export default function ProfileRoute() {
  return <ProfileScreen />;
}