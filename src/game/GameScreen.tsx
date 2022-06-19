import './GameScreen.scss';
import { Player } from '../common/player/player';
import Sprite from '../store/sprites/Sprite';
import GameView from './game-view/GameView';


export interface GameScreenProps {
    player: Player;
}

const GameScreen = (props: GameScreenProps) => {
    const { player } = props;

    return (
        <div className="rjs-game-screen">
            <div className="rjs-gui">
                <Sprite name="backtop1" canvasId="backtop1" className="rjs-gui-sprite" />
                <Sprite name="backbase1" canvasId="backbase1" className="rjs-gui-sprite" />
                <Sprite name="backbase2" canvasId="backbase2" className="rjs-gui-sprite" />
                <Sprite name="backhmid1" canvasId="backhmid1" className="rjs-gui-sprite" />
                <Sprite name="backhmid2" canvasId="backhmid2" className="rjs-gui-sprite" />
                <Sprite name="backleft1" canvasId="backleft1" className="rjs-gui-sprite" />
                <Sprite name="backleft2" canvasId="backleft2" className="rjs-gui-sprite" />
                <Sprite name="backright1" canvasId="backright1" className="rjs-gui-sprite" />
                <Sprite name="backright2" canvasId="backright2" className="rjs-gui-sprite" />
                <Sprite name="backvmid1" canvasId="backvmid1" className="rjs-gui-sprite" />
                <Sprite name="backvmid2" canvasId="backvmid2" className="rjs-gui-sprite" />
                <Sprite name="backvmid3" canvasId="backvmid3" className="rjs-gui-sprite" />
                <Sprite name="compass" canvasId="compass" className="rjs-gui-sprite" />
                <Sprite name="mapback" canvasId="mapback" className="rjs-gui-sprite" />
                <Sprite name="chatback" canvasId="chatback" className="rjs-gui-sprite" />
                <Sprite name="invback" canvasId="invback" className="rjs-gui-sprite" />
            </div>

            <GameView/>
        </div>
    );
};

export default GameScreen;
