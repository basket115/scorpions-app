import React from 'react';
import { IonApp } from '@ionic/react';

import Tab1 from './pages/Tab1';

/* Ionic core css */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional utilities */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme */
import './theme/variables.css';

const App: React.FC = () => (
  <IonApp>
    <Tab1 />
  </IonApp>
);

export default App;
