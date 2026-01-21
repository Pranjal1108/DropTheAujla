from flask import Blueprint, request, jsonify
from game_engine import GameEngine

api_blueprint = Blueprint('api', __name__)

sessions = {}
wallets = {}


def get_wallet(user_id):
    if user_id not in wallets:
        wallets[user_id] = {'balance': 1000.0}
    return wallets[user_id]


@api_blueprint.route('/balance', methods=['GET'])
def get_balance():
    user_id = request.args.get('userId', 'default')
    wallet = get_wallet(user_id)
    return jsonify({'balance': wallet['balance']})


@api_blueprint.route('/bet', methods=['POST'])
def place_bet():
    try:
        data = request.get_json()
        print(f"[BET] {data}")
        
        user_id = data.get('userId', 'default')
        bet_amount = float(data.get('betAmount', 0))
        bonus_mode = data.get('bonusMode', False)
        
        if bet_amount <= 0:
            return jsonify({'error': 'Invalid bet amount'}), 400
        
        wallet = get_wallet(user_id)
        
        if bet_amount > wallet['balance']:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        wallet['balance'] -= bet_amount
        
        engine = GameEngine()
        game_result = engine.generate_game(bet_amount, bonus_mode)
        
        session_id = game_result['sessionId']
        sessions[session_id] = {
            'userId': user_id,
            'betAmount': bet_amount,
            'targetPayout': game_result['targetPayout'],
            'resolved': False
        }
        
        print(f"[GAME] outcome={game_result['outcomeType']}, target=₹{game_result['targetPayout']}, stopAt={game_result['script']['stopAtY']}")
        
        return jsonify({
            'sessionId': session_id,
            'seed': game_result['seed'],
            'targetPayout': game_result['targetPayout'],
            'multiplier': game_result['multiplier'],
            'outcomeType': game_result['outcomeType'],
            'script': game_result['script'],
            'balance': wallet['balance']
        })
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@api_blueprint.route('/resolve', methods=['POST'])
def resolve_game():
    """
    Resolve game - called ONLY when checkShouldStop() ends the run.
    This is the ONLY way to get a payout.
    """
    try:
        data = request.get_json()
        session_id = data.get('sessionId')
        user_id = data.get('userId', 'default')
        
        if session_id not in sessions:
            return jsonify({'error': 'Invalid session'}), 400
        
        session = sessions[session_id]
        
        if session['resolved']:
            return jsonify({'error': 'Already resolved'}), 400
        
        session['resolved'] = True
        
        wallet = get_wallet(user_id)
        payout = session['targetPayout']
        wallet['balance'] += payout
        
        print(f"[RESOLVE] payout=₹{payout}, balance=₹{wallet['balance']}")
        
        del sessions[session_id]
        
        return jsonify({
            'payout': payout,
            'balance': wallet['balance']
        })
        
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': str(e)}), 500


@api_blueprint.route('/cancel', methods=['POST'])
def cancel_game():
    """
    Cancel game - for deaths and tab hidden.
    No payout is given.
    """
    try:
        data = request.get_json()
        session_id = data.get('sessionId')
        user_id = data.get('userId', 'default')
        
        if session_id in sessions:
            print(f"[CANCEL] session={session_id}")
            del sessions[session_id]
        
        wallet = get_wallet(user_id)
        return jsonify({'balance': wallet['balance']})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500