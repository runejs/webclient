import './TitleButton.scss';
import Sprite from '../store/sprites/Sprite';
import Text from '../store/fonts/Text';


export interface TitleButtonProps {
    id: string;
    className?: string;
    children?: string;
    onClick?: () => void;
}

const TitleButton = (props: TitleButtonProps) => {
    return (
        <div className={ `rjs-titlebutton${props.className ? ` ${props.className}` : ''}` } onClick={props.onClick}>
            <Sprite name="titlebutton" canvasId={ props.id } className="rjs-titlebutton-bg"/>
            <Text font="b12_full" align="center" dropShadow className="rjs-titlebutton-text">
                { props.children }
            </Text>
        </div>
    );
};

export default TitleButton;
