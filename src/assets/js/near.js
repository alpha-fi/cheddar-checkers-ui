import $ from 'jquery';
import * as nearApi from 'near-api-js';
import { inizialise_game } from './script';
import { baseDecode} from 'borsh';
import { createTransaction } from 'near-api-js/lib/transaction';
import { PublicKey } from 'near-api-js/lib/utils'

const nft_contract = "nft-checkers.near";
// const nft_contract = "nft.cheddar.testnet";
const nft_web4_url = "https://nft-checkers.near.page/style";
export const players_css = ["player-1", "player-2"];

const nearConfig = {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    contractName: "app.checkers.near",
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://explorer.mainnet.near.org',

    
    // networkId: 'testnet',
    // nodeUrl: 'https://rpc.testnet.near.org',
    // contractName: "checkers.cheddar.testnet",
    // walletUrl: 'https://wallet.testnet.near.org',
    // helperUrl: 'https://helper.testnet.near.org',
    // explorerUrl: 'https://explorer.testnet.near.org',
    
};

export let current_game_id = -1;
let loadPlayersInterval;
let loadGamesInterval;
let loadGameInterval;

async function load() {
    if (loadPlayersInterval)
        clearInterval(loadPlayersInterval);
    if (loadGamesInterval)
        clearInterval(loadGamesInterval);
    if (loadGameInterval)
        clearInterval(loadGameInterval);
    // console.log("loadGameInterval")
    // console.log(loadGameInterval)

    loadAvailableGames().then(async (my_games) => {
        update_game_ui(my_games);
        if (!my_games.length) {
            loadPlayers().then(() => {
                loadPlayersInterval = setInterval(async () => {
                    await loadPlayers()
                }, 10000);
            });

            // check for new game
            loadGamesInterval = setInterval(async () => {
                await loadAvailableGames().then(async (my_games) => {
                    update_game_ui(my_games);
                    if(loadGameInterval)
                        clearInterval(loadGameInterval);
                    load_game().then(() => {
                        loadGameInterval = setInterval(async () => {
                            await load_game()
                        }, 3000)
                    });
                });
            }, 10000);
        } else{
            if(loadGameInterval)
                clearInterval(loadGameInterval);
            load_game().then(() => {
                loadGameInterval = setInterval(async () => {
                    await load_game()
                }, 3000)
            });
        }
    })
}

function update_game_ui(my_games) {
    if (my_games.length) {
        // console.log("Current game found!");
        // console.log(my_games);

        $('#near-game').removeClass('hidden');
        current_game_id = my_games[0][0];

        $('#near-waiting-list').addClass('hidden');
        $('#near-available-players').addClass('hidden');
        $('#near-make-available-block').addClass('hidden');
        $('#near-make-unavailable-block').addClass('hidden');
    } else {
        $('#near-waiting-list').removeClass('hidden');
        $('#near-available-players').removeClass('hidden');
    }

    $('#near-game-stats').toggleClass('hidden', my_games.length === 0);
}

function getPlayerByIndex(game, index) {
    if (index === 0) {
        return game.player_1;
    } else if (index === 1) {
        return game.player_2;
    } else {
        alert("Error with player index");
        return -1;
    }
}

let force_reload = false;
let last_updated_turn = -1;

export async function stop_game() {
    await window.contract.stop_game({game_id: current_game_id}, GAS_GIVE_UP).then(async resp => {
        force_reload = true;
        await load_game();
    }).catch(async e => {
        force_reload = true;
        alert(e);
        await load_game();
    });

}

async function load_game() {
    if (current_game_id >= 0) {
        //let pieces = [];
        //let tiles = [];
        // console.log("current_game_id: " + current_game_id);
        await window.contract.get_game({game_id: current_game_id}).then(async (game) => {
            if (!game)
                return;

            force_reload = false;

            // console.log("Current player: " + getPlayerByIndex(game, game.current_player_index));
            let is_turn_availabe = getPlayerByIndex(game, game.current_player_index) === window.accountId;

            if (game.turns > -1) {
                let player_1_spent = getTimeSpent(game.total_time_spent[0], game.last_turn_timestamp, game.current_player_index === 0);
                let player_2_spent = getTimeSpent(game.total_time_spent[1], game.last_turn_timestamp, game.current_player_index === 1);
                document.getElementById('near-player-1-time-spent').innerText = "Time spent: " + fromatTimestamp(player_1_spent);
                document.getElementById('near-player-2-time-spent').innerText = "Time spent: " + fromatTimestamp(player_2_spent);

                if (game.player_1 === window.accountId && isOpponentTimeSpent(player_2_spent)) {
                    $('#near-player-1-stop-game').removeClass('hidden');
                } else if (game.player_2 === window.accountId && isOpponentTimeSpent(player_1_spent)) {
                    $('#near-player-2-stop-game').removeClass('hidden');
                }
            }

            window.player1 = game.player_1;
            window.player2 = game.player_2;
            await loadPlayerNFT();

            if (!force_reload && is_turn_availabe && last_updated_turn === game.turns && game.winner_index === null) {
                // console.log("UI update skipped");
                return;
            }

            last_updated_turn = game.turns;

            let selectedPiece = $('.selected').attr("id");
            $('.piece').remove();
            // console.log(game);

            document.getElementById('near-game-player-1').innerText = game.player_1;
            document.getElementById('near-game-player-2').innerText = game.player_2;
            document.getElementById('near-game-turn').innerText = game.turns;
            let half_reward = parseFloat(nearApi.utils.format.formatNearAmount(game.reward.balance, 2)) / 2;
            document.getElementById('near-player-1-deposit').innerText = "Deposit: " + half_reward + " NEAR";
            document.getElementById('near-player-2-deposit').innerText = document.getElementById('near-player-1-deposit').innerText;

            if (game.winner_index !== null) {
                $('#near-game-finished').removeClass('hidden');
                document.getElementById('near-game-winner').innerText = getPlayerByIndex(game, game.winner_index);
                document.getElementById('near-game-reward').innerText = nearApi.utils.format.formatNearAmount(game.reward.balance, 2);
                $('#near-game-give-up').addClass('hidden');
                $('#near-game-turn').addClass('hidden');
            } else{
                $('#near-game-finished').addClass('hidden');
                $('#near-game-give-up').removeClass('hidden');
                $('#near-game-turn').removeClass('hidden');

            }

            if (game.current_player_index === 0) {
                $('#near-active-player-1').removeClass('hidden');
                $('#near-active-player-2').addClass('hidden');
                $('.turn').css("background", "linear-gradient(to right, #BEEE62 50%, transparent 50%)");
            } else if (game.current_player_index === 1) {
                $('#near-active-player-2').removeClass('hidden');
                $('#near-active-player-1').addClass('hidden');
                $('.turn').css("background", "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
            }


            //let board = reverseArray(game.board)

            /*let board = game.board.reverse();
            if(game.player_1 === window.accountId){
                console.log("reverse board");
                //board = reversePlayers(board.reverse());
                board = reversePlayers(board);
                console.log(board)
            }
            else{
                board = reverseArray(game.board.reverse())
                board = reversePlayers(board);
            }*/


            let board = game.board;

            if (game.player_1 === window.accountId) {
                board = board.reverse();
                //board = reverseArray(board);
                //board = reversePlayers(board);
            } else if (game.player_2 === window.accountId) {
                board = reverseArray(board);
                board = reversePlayers(board);
            }

            let inverse_colors = (game.player_2 === window.accountId);

            inizialise_game(board, [2, 1][parseInt(game.current_player_index)], inverse_colors); // 0 -> 2, 1 -> 1

            if (selectedPiece && is_turn_availabe) {
                $('#' + selectedPiece).addClass('selected');
            }

            $('.piece').toggleClass('disabled', !is_turn_availabe);
        })
    }
}

function isOpponentTimeSpent(time_spent) {
    return (time_spent > 3600);
}

function getTimeSpent(total_time_spent, last_turn_timestamp, is_current_player) {
    if (is_current_player) {
        let after_last_turn = new Date().getTime() / 1000 - last_turn_timestamp / 1000000000;
        return (total_time_spent / 1000000000 + after_last_turn);
    } else {
        return (total_time_spent / 1000000000);
    }
}

function fromatTimestamp(total_seconds) {
    var sec_num = parseInt(total_seconds, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;

}

export async function make_move(line) {
    if (current_game_id >= 0) {
        // console.log("make_move: " + line);
        await window.contract.make_move({game_id: current_game_id, line}, GAS_MOVE).then(async resp => {
            force_reload = true;
            await load_game();
        }).catch(async e => {
            let string = JSON.stringify(e);
            let error_begins = string.indexOf("***");
            if (error_begins !== -1) {
                let error_ends = string.indexOf("'", error_begins);
                force_reload = true;
                alert(string.substring(error_begins + 4, error_ends));
            } else {
                alert(e);
            }

            await load_game();
        });
    }
}

export async function give_up() {
    if (current_game_id >= 0) {
        await window.contract.give_up({game_id: current_game_id}, GAS_GIVE_UP, 1).then(async resp => {
            // console.log(resp);
            await load_game();
        })
    }
}

async function loadAvailableGames() {
    // console.log("get_available_games");
    return await window.contract.get_available_games({from_index: 0, limit: 50}).then(games => {
        // console.log(games)
        let mygames = games.filter(game => (game[1][0] === window.accountId || game[1][1] === window.accountId));
        return mygames;
    });
}

async function loadPlayers() {
    // console.log("get_available_players");
    await window.contract.get_available_players({from_index: 0, limit: 50}).then(players => {
        $('#near-available-players-hint').toggleClass('hidden', players.length === 0)
        if (players.length) {
            let current_player_is_available = false;
            let items = players.map(player => {
                if (!current_player_is_available && player[0] === window.accountId) {
                    current_player_is_available = true;
                }
                if (player[0] !== window.accountId) {
                    return `<li><a href="#" onclick='select("${player[0]}", "${player[1].deposit}")'>${player[0]}, bid: ${nearApi.utils.format.formatNearAmount(player[1].deposit, 2)} NEAR</a>`;
                } else {
                    return `<li><strong>${player[0]}, bid: ${nearApi.utils.format.formatNearAmount(player[1].deposit, 2)} NEAR</strong>`;
                }
            });
            $('#near-available-players-list').html('<ul>' + items.join() + '</ul>');

            // console.log("current_player_is_available " + current_player_is_available)
            $('#near-make-available-block').toggleClass('hidden', current_player_is_available);
            $('#near-make-unavailable-block').toggleClass('hidden', !current_player_is_available);
        } else {
            $('#near-make-available-block').removeClass('hidden');
            $('#near-available-players-list').html("No players available. Be the first!");
        }
    })
}



const GAS_START_GAME = 50000000000000;
const GAS_GIVE_UP = 50000000000000;
const GAS_MOVE = 30000000000000;

export function get_referral() {
    try {
        var url = new URL(window.location.href);
        return url.searchParams.get("r");
    } catch (e) {
        console.log(e);
        return "";
    }
}

// async function select(player, deposit) {
//     let referrer_id = get_referral();
//     await window.contract.start_game({
//         opponent_id: player,
//         referrer_id
//     }, GAS_START_GAME, deposit).then(resp => console.log(resp));
// }

export function logout() {
    window.walletConnection.signOut()
    // reload page
    window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
    // Allow the current app to make calls to the specified contract on the
    // user's behalf.
    // This works by creating a new access key for the user's account and storing
    // the private key in localStorage.
    window.walletConnection.requestSignIn(nearConfig.contractName, "Near Checkers")
}

export function loadScript(src, callback) {
    var s,
        r,
        t;
    r = false;
    s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src;
    s.onload = s.onreadystatechange = function () {
        //console.log( this.readyState ); //uncomment this line to see which ready states are called.
        if (!r && (!this.readyState || this.readyState === 'complete')) {
            r = true;
            callback();
        }
    };
    t = document.getElementsByTagName('script')[0];
    t.parentNode.insertBefore(s, t);
}


export function after() {

    const nearPromise = (async () => {

        const near = await nearApi.connect(Object.assign({deps: {keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore()}}, nearConfig))

        // Initializing Wallet based Account. It can work with NEAR testnet wallet that
        // is hosted at https://wallet.testnet.near.org
        window.walletConnection = new nearApi.WalletConnection(near)

        // Getting the Account ID. If still unauthorized, it's just empty string
        window.accountId = window.walletConnection.getAccountId()

        // Initializing our contract APIs by contract name and configuration
        window.contract = await new nearApi.Contract(window.walletConnection.account(), nearConfig.contractName, {
            // View methods are read only. They don't modify the state, but usually return some value.
            viewMethods: ['get_available_players', 'get_available_games', 'get_game'],
            // Change methods can modify the state. But you don't receive the returned value when called.
            changeMethods: ['make_available', 'make_available_ft', 'start_game', 'make_move', 'give_up', 'make_unavailable', 'stop_game'],
        })

        window.nft_contract = await new nearApi.Contract(window.walletConnection.account(), nft_contract, {
            viewMethods: ['nft_tokens_for_owner'],
        })

        window.nft_tokens = ["", ""];

        await load();

        if (!window.accountId) {
            $('#near-action-login').html('<input type="button" class="login-button" onclick="login()" value="Log In">');
            $('.only-after-login').addClass('hidden');
            $('.only-before-login').removeClass('hidden');

        } else {
            $('#near-account').html("Logged in as " + window.accountId);
            $('#near-action').html('<input type="button" onclick="logout()" value="Log Out">');
            $('.only-after-login').removeClass('hidden');
            $('.only-before-login').addClass('hidden');

            $('#near-account-ref').html("<div>Invite a friend to get a 10% referral bonus:</div><div><input type='text' style='width: 280px' value='https://checkers.nearspace.info/?r=" + window.accountId + "'/></div>");

            // console.log("Logged in as " + window.accountId);
        }
    })();


}

async function loadPlayerNFT() {
    if (window.nft_loaded === true || !window.player1 || !window.player2)
        return;

    window.nft_loaded = true;
    await window.nft_contract.nft_tokens_for_owner({account_id: window.player1}).then(tokens => {
        if (tokens.length) {
            loadPlayerCss(tokens[tokens.length - 1].token_id, 0);
        }
    });

    await window.nft_contract.nft_tokens_for_owner({account_id: window.player2}).then(tokens => {
        if (tokens.length) {
            loadPlayerCss(tokens[tokens.length - 1].token_id, 1);
        }
    })
}

function loadPlayerCss(token_id, index) {
    // console.log("LOAD TOKEN: " + token_id);
    const cssId = 'nft-css-' + index;
    if (!document.getElementById(cssId)) {
        window.nft_tokens[index] = token_id;
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = `${nft_web4_url}/${token_id}.css`;
        link.media = 'all';
        head.appendChild(link);

        updatePlayerNft(index)
    }
}

export function updateAllPlayersNft() {
    if (window.nft_tokens && window.nft_tokens.length) {
        [0, 1].map(index => {
            if (window.nft_tokens[index] !== "")
                replacePlayerNftClass(index);
        });
    }
}

function updatePlayerNft(index) {
    if (window.nft_tokens.length) {
        if (window.nft_tokens[index] !== "")
            replacePlayerNftClass(index);
    }
}

function replacePlayerNftClass(index) {
    let nft_class = window.nft_tokens[index];
    let player_class = players_css[index];
    let player_account = index === 1 ? window.player2 : (index === 0 ? window.player1 : "");

    let player_account_css = player_account.replace(".", "_").replace("-", "_");
    let nft_css = nft_class.replace(".", "_").replace(" ", "_").replace("-", "_");

    var places = document.getElementsByClassName(player_class);
    for (var x = 0; x < places.length; x++) {
        if (!places[x].classList.contains(nft_css))
            places[x].classList.add(nft_css);
        if (!places[x].classList.contains(player_account_css))
            places[x].classList.add(player_account_css);
    }
}


function reversePlayers(arr) {
    let i, j;
    for (i = 0; i < 8; i++) {
        for (j = 0; j < 8; j++) {
            if (arr[i][j] > 0)
                arr[i][j] = arr[i][j] % 2 + 1;
            else if (arr[i][j] < 0)
                arr[i][j] = -1 * (Math.abs(arr[i][j]) % 2 + 1);
        }
    }
    return arr;
}

function reverseArray(arr) {
    // https://www.geeksforgeeks.org/program-to-reverse-the-rows-in-a-2d-array/
    // Traverse each row of arr
    let i;
    for (i = 0; i < 8; i++) {

        // Initialise start and end index
        var start = 0;
        var end = 8 - 1;

        // Till start < end, swap the element
        // at start and end index
        while (start < end) {

            // Swap the element
            var temp = arr[i][start];
            arr[i][start] = arr[i][end];
            arr[i][end] = temp;

            // Increment start and decrement
            // end for next pair of swapping
            start++;
            end--;
        }
    }

    return arr;
}

async function setupTransaction({ receiverId, actions, nonceOffset = 1}) {


  const localKey = await window.walletConnection.account().connection.signer.getPublicKey(
    window.accountId,
    window.walletConnection.account().connection.networkId
  );

  let accessKey = await window.walletConnection.account().accessKeyForTransaction(
    receiverId,
    actions,
    localKey
  );

  if (!accessKey) {
    throw new Error(
      `Cannot find matching key for transaction sent to ${receiverId}`
    );
  }

  const block = await window.walletConnection.account().connection.provider.block({ finality: 'final' });
  const blockHash = baseDecode(block.header.hash);

  const publicKey = PublicKey.from(accessKey.public_key);
  const nonce = accessKey.access_key.nonce + nonceOffset;

  return createTransaction(
    window.accountId,
    publicKey,
    receiverId,
    nonce,
    actions,
    blockHash
  );
}

 async function ft_transfer(sender_id, amount, token_id) {

//     const transactions = [];

//       transactions.unshift({
//         receiverId: token_id,
//         functionCalls: [
//           {
//             methodName: 'ft_transfer_call',
//             args: {
//               receiver_id: nearConfig.con,
//               amount: amount,
//               msg: "transfer ft"
//             },
//             amount: new nearApi.utils.format.parseNearAmount('0.000000000000000000000001'),
//             gas: '75000000000000'
//           }
//         ]
//       });

//       let connectedWalletAccount = window.walletConnection.account();

//       let isAccountRegistered = (await connectedWalletAccount.viewFunction(token_id , "storage_balance_of", { account_id: accountId })) != null;

//       if(!isAccountRegistered) {
//           transactions.unshift({
//             receiverId: token_id,
//             functionCalls: [
//               {
//                 methodName: 'storage_deposit',
//                 args: {
//                   account_id: sender_id
//                 },
//                 amount: nearApi.utils.format.parseNearAmount('0.2'),
//                 gas: '100000000000000'
//               }
//             ]
//           });
//       }

//     const currentTransactions = await Promise.all(
//     transactions.map((t, i) => {
//       return setupTransaction({
//           receiverId: t.receiverId,
//           nonceOffset: i + 1,
//           actions: t.functionCalls.map((fc) =>
//             {
//               fc.methodName,
//               fc.args,
//               fc.gas,
//               fc.amount
//             }
//           ),
//         });
//       })
//     );

//   window.walletConnection.requestSignTransactions(currentTransactions)

 }
