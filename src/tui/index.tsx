import { render } from "ink";
import { App } from "./App";
import { mockState } from "../fixtures/mockState";

render(<App state={mockState} />);
