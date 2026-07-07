import { Redirect } from 'expo-router';
import { ReactElement } from 'react';

// The center tab uses a custom button that pushes /capture directly, so this
// route is normally never shown. The redirect is a safety net.
export default function NewPlaceRoute(): ReactElement {
  return <Redirect href="/capture" />;
}
