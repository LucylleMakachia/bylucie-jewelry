import UnauthorizedPage from "./UnauthorizedPage";

export default function AccessDenied() {
  return (
    <UnauthorizedPage
      title="Access Denied"
      message="This page is restricted to administrators only."
      actionText="Go Back Home"
      showSignIn={true} 
    />
  );
}
