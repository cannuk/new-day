import React from 'react';
import { ThemeProvider } from 'theme-ui';
import { useSelector, useDispatch } from 'react-redux';
import theme from './themes/start';
import { PersistGate } from 'redux-persist/integration/react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import { Day } from './features/day/Day';

import { persistor } from './app/store';
import { CurrentDay } from './features/day/CurrentDay';

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <PersistGate loading={null} persistor={persistor}>
          <Switch>
            <Route path="/day/:id" render={({ match }: any) => <Day dayId={match.id} />} />
            <Route path="/" render={() => <CurrentDay />} />
          </Switch>
        </PersistGate>
      </ThemeProvider>
    </Router>
  );
}

export default App;
