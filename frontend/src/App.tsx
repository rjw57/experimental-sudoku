import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';
import { IndexPage, SolvePage } from './pages';

export const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={IndexPage} />
      <Route exact path="/solve/:puzzleId" component={SolvePage} />
    </Switch>
  </Router>
);

export default App;
