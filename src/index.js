import React from "react";
import ReactDOM from "react-dom";

import "./styles.css";

/* global wialon */

// utills function
function msg(msg) {
  console.log(msg);
}

// Main app class
class App extends React.Component {
  constructor() {
    super();

    this.updateUnitState = this.updateUnitState.bind(this);

    this.state = {
      // demo token
      token:
        "5dce19710a5e26ab8b7b8986cb3c49e58C291791B7F0A7AEB8AFBFCEED7DC03BC48FF5F8",
      // is authorized
      isAuthorized: false,
      units: []
    };
  }

  componentDidMount() {
    const token = this.state.token;
    // initialize Wialon session
    wialon.core.Session.getInstance().initSession("https://hst-api.wialon.com");
    // Try to login when component mount
    wialon.core.Session.getInstance().loginToken(
      token,
      "", // try to login
      code => {
        // login callback
        // if error code - print error message
        if (code) {
          msg(wialon.core.Errors.getErrorText(code));
          return;
        }
        msg("Logged successfully");
        // when login suceed then run init() function
        this.setState({ isAuthorized: true }, this.init());
      }
    );
  }

  updateUnitState(event) {
    // get new unit from event
    const eventedUnit = event.getTarget();

    console.log("New message for", eventedUnit.getName(), event);

    // update state
    // see: https://redux.js.org/recipes/structuring-reducers/immutable-update-patterns#updating-an-item-in-an-array
    let unitsState = this.state.units.map(item => {
      if (item.id !== eventedUnit.getId()) {
        // This isn't the item we care about - keep it as-is
        return item;
      }

      // Otherwise, this is the one we want - return an updated value
      return {
        id: eventedUnit.getId(),
        name: eventedUnit.getName(),
        lastMessageTime: eventedUnit.getLastMessage()
          ? eventedUnit.getLastMessage().t
          : 0,
        raw: eventedUnit
      };
    });

    this.setState({ units: unitsState });
  }

  init() {
    const sess = wialon.core.Session.getInstance(); // get instance of current Session
    // flags to specify what kind of data should be returned
    const flags =
      wialon.item.Item.dataFlag.base | wialon.item.Unit.dataFlag.lastMessage;

    sess.loadLibrary("itemIcon"); // load Icon Library
    sess.updateDataFlags(
      // load items to current session
      [{ type: "type", data: "avl_unit", flags: flags, mode: 0 }], // Items specification
      code => {
        // updateDataFlags callback
        if (code) {
          msg(wialon.core.Errors.getErrorText(code));
          return;
        } // exit if error code

        // get loaded 'avl_unit's items
        const units = sess.getItems("avl_unit");
        if (!units || !units.length) {
          msg("Units not found");
          return;
        } // check if units found

        let unitsState = [];
        for (let i = 0; i < units.length; i++) {
          let unit = units[i];
          unitsState.push({
            id: unit.getId(),
            name: unit.getName(),
            lastMessageTime: unit.getLastMessage()
              ? unit.getLastMessage().t
              : null,
            raw: unit
          });

          // add event listener
          unit.addListener("messageRegistered", this.updateUnitState);
        }

        // set State
        this.setState({ units: unitsState });
      }
    );
  }

  render() {
    const { isAuthorized, units } = this.state;

    return (
      <div className="App">
        {!isAuthorized ? (
          <h5>Loading...</h5>
        ) : (
          <div className="list">
            {units.map(u => (
              <div className="row" key={u.id}>
                <div>
                  <b>Name:</b> {u.name} or {u.raw.getName()}
                </div>
                <div>
                  <b>Last message time:</b>
                  {u.lastMessageTime} {" or "}
                  {wialon.util.DateTime.formatTime(u.lastMessageTime, 0)}
                </div>
                <div>
                  <b>Last position:</b>

                  {!u.raw.getPosition()
                    ? "-"
                    : " x: " +
                      u.raw.getPosition().x +
                      " y: " +
                      u.raw.getPosition().y}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
