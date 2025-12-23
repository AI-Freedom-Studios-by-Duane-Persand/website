import Link from 'next/link';

const Navigation = ({ isLoggedIn }) => {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8f9fa' }}>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', margin: 0, padding: 0 }}>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link href="/campaigns">Campaigns</Link>
        </li>
        <li>
          <Link href="/settings/social-accounts">Social Accounts</Link>
        </li>
      </ul>

      <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', margin: 0, padding: 0 }}>
        {isLoggedIn ? (
          <>
            <li>
              <Link href="/profile">
                <img
                  src="/profile-icon.png"
                  alt="Profile"
                  style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                />
              </Link>
            </li>
            <li>
              <Link href="/logout">Logout</Link>
            </li>
          </>
        ) : (
          <li>
            <Link href="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;