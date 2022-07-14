import React, {useState} from 'react';



function App() {
  const [isRule, setRule] = useState("true");
  const handleRuleToggle = () => {
     setRule(!isRule);
  }

  const handleGiveUp = () => {
    window.give_up(); 
  }

  const handleStopGame = () => {
    window.stop_game();
  }
  
  return (
    <div className='game-container'>
        <div className="column" style={{minHeight: 0, paddingBottom: "30px"}}>
          <div className="info">
            <h1>NEAR Checkers</h1>

            <div className="only-before-login">
              <div className="subtitle">
                Login with NEAR account (or <a href="//wallet.near.org" target="_blank">create one for free!</a>)
              </div>
              <div id="near-action-login"></div>
            </div>

            <div className="only-after-login">              
              <div id="near-account"></div>
              <div id="near-action"></div>
              <div id="near-available-players" className="hidden">
                <div className="subtitle">Available players<span id="near-available-players-hint" className="hidden"> (click on a player to start a game)</span>:
                </div>
                <div id="near-available-players-list"></div>
              </div>
              <div id="near-waiting-list" className="hidden">
                <div id="near-make-available-block" className="hidden">
                  <div className="subtitle">
                    <label htmlFor="near-bid-deposit">Join waiting list:</label>
                  </div>
                  <div>
                    My bid: <input type="text" id="near-bid-deposit" defaultValue={0} style={{width: "30px"}}/> NEAR
                  </div>
                  <div>
                    Cheddar bid: <input type="text" id="cheddar-bid-deposit" defaultValue={0} style={{width: "30px"}}/> Cheddar
                  </div>
                  <button className='button' id="near-make-available">Join waiting list</button>
                </div>
                <div id="near-make-unavailable-block" className="hidden">
                  <button className='button' id="near-make-unavailable">Leave waiting list</button>
                </div>
              </div>
              <div id="near-game" className="hidden">
                <div id="near-game-turn-block" className="subtitle">There is an ongoing game on turn #<span id="near-game-turn">...</span></div>
                <div id="near-game-give-up"><button className='button' onClick={handleGiveUp}>Concede</button></div>
                <div id="near-game-finished" className="subtitle hidden">Game winner: <span id="near-game-winner">...</span>.
                  <br></br>
                  Reward: <span id="near-game-reward">...</span> NEAR
                </div>
              </div>
            </div>
            <div style={{paddingTop: "10px"}}>
              <a href="#" onClick= {handleRuleToggle}>Rules (Click to expand/hide)</a>
              <div id="near-game-rules" className={isRule ? "hidden" : null }>
                <ul>
                  <li>Click a checkbox "double jump" on the top of the board before every double jump. Shift key makes the same trick.</li>
                  <li>Set a bid and join waiting list or select an available player to start the game.</li>
                  <li>The winner takes the pot.</li>
                  <li>Invite a friend to get a 10% referral bonus from his rewards.</li>
                  <li>Hold shift button (or check a checkbox) to perform a double jump. Release a shift button before a final
                    move.
                  </li>
                  <li>If you spent more than an hour, your opponent may stop the game and get the reward.</li>
                  <li>Service fee is 10%, referral reward is half of the service fee.</li>
                  <li>Various game stats are storing onchain.</li>
                </ul>
                <div className="subtitle">General Game Rules (<a href="https://en.wikipedia.org/wiki/Draughts" target="_blank">source</a>)</div>
                <ul>
                  <li>Capturing is mandatory. Double capturing is not mandatory.</li>
                  <li>Uncrowned pieces (men) move one step diagonally forwards, and capture an opponent's piece. Men can jump only forwards. Multiple enemy pieces can be captured in a single turn provided this is done by successive jumps made by a single piece.</li>
                  <li>Kings acquires additional powers including the ability to move backwards and capture backwards.</li>
                </ul>
              </div>
            </div>
          </div>
          <div id="near-game-stats" className="stats hidden">
            <h2>Game Statistics</h2>
            <div className="wrapper">
              <div id="player1">
                <h3>
                  <div style={{paddingBottom: "5px"}}><p id="near-game-player-1" style={{color: "#e4a6ae"}}></p></div>
                  <div style={{height: "30px"}}><span id="near-active-player-1" className="active-player hidden">(Active)</span></div>
                </h3>
                <div id="near-player-1-deposit"></div>
                <div id="near-player-1-time-spent"></div>
                <div id="near-player-1-stop-game" className="hidden">
                  <button onClick={handleStopGame} className="button centered">Stop game and get reward</button>
                </div>
              </div>
              <div id="player2">
                <h3>
                  <div style={{paddingBottom: "5px"}}><p id="near-game-player-2" style={{color: "#8b8bff"}}></p></div>
                  <div style={{height: "30px"}}><span id="near-active-player-2" className="active-player hidden">(Active)</span></div>
                </h3>
                <div id="near-player-2-deposit"></div>
                <div id="near-player-2-time-spent"></div>
                <div id="near-player-2-stop-game" className="hidden">
                  <button onClick={handleStopGame} className="button centered">Stop game and get reward</button>
                </div>
              </div>
            </div>
            <div className="clearfix"></div>
            <div className="turn"></div>
            <span id="winner"></span>
            <div className="hidden">
              <button id="cleargame">Reload</button>
            </div>
          </div>
          <div className="account only-after-login">
            <div>
              <div id="near-account-ref"></div>
            </div>
          </div>
        </div>
        <div className="column">
          <div style={{textAlign: "center"}}>
            <input type="checkbox" id="near-game-double-move"/>
            <label htmlFor="near-game-double-move" style={{color: "#eee"}}>Double 
            jump</label>
          </div>
          <div id="board">
            <div className="tiles"></div>
            <div className="pieces">
              <div className="player1pieces">
              </div>
              <div className="player2pieces">
              </div>
            </div>
          </div>
        </div>

    </div>
  );
}

export default App;
