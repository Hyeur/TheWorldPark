import { _decorator, CircleCollider2D, Component, Contact2DType, Node, Rect, Vec2 } from 'cc';

export class Tools {
    public static RandomRange(min: number, max: number, int: boolean = false) {

        var delta = max - min;
        var rnd = Math.random();
        var result = min + rnd * delta;

        if (int) {
            result = Math.round(result);

        }
        return result;

    }

    public static RandomPositionIn2PointArea(firstPoint: Vec2, secondPoint: Vec2, offsetWidth?: number, offsetHeight?: number): Vec2 {
        if (offsetWidth){
            firstPoint.x += offsetWidth;
            secondPoint.x -= offsetWidth;
        }
        if (offsetHeight){
            firstPoint.y += offsetWidth;
            secondPoint.y -= offsetWidth;
        }
        let x = this.RandomRange(firstPoint.x, secondPoint.x);
        let y = this.RandomRange(firstPoint.y, secondPoint.y);
    
        return new Vec2(x, y);
    }
    
    public static RandomPositionInRect(rect: Rect, offsetWidth?: number, offsetHeight?: number): Vec2 {
        if (offsetWidth){
            rect.width -= offsetWidth * 2;
        }
        if (offsetHeight){
            rect.height -= offsetWidth * 2;
        }
        let x = this.RandomRange(rect.x, rect.x + rect.width);
        let y = this.RandomRange(rect.y, rect.y + rect.height);
        
        return new Vec2(x, y);
    }

}