import {
  BrowserRouter as Router,
  Link,
  Route,
  Switch,
} from 'react-router-dom';
import { SolvePage } from './pages';

export const App = () => (
  <Router>
    <Switch>
      <Route exact path="/">
        <Link to="/solve/foo">example</Link>
      </Route>
      <Route exact path="/solve/:puzzleId">
        <SolvePage />
      </Route>
    </Switch>
  </Router>
);

export default App;
