import {
  BrowserRouter as Router,
  Route,
  Switch,
  RouteComponentProps,
} from 'react-router-dom';
import { IndexPage, SolvePage } from './pages';

export const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={IndexPage} />
      <Route exact path="/puzzles/:puzzleId" component={
        ({ match: { params: { puzzleId } } }: RouteComponentProps<{ puzzleId: string}>) => (
          <SolvePage puzzleId={puzzleId} />
        )
      } />
    </Switch>
  </Router>
);

export default App;
