## 客户端请求

- server_info

    玩家发送该请求，表明其需要获取服务器信息。

- join_level

    玩家发送该请求，表明其需要加入某个地图。

    - id : str
        地图的 UUID。

- leave_level

    玩家发送该请求，表明其需要离开当前地图。

- global_sync

    玩家发送该请求，表明其需要全局同步当前游戏状态。

- chat

    玩家发送聊天消息，服务器将该消息广播给所有玩家。

    - content : str
        聊天内容，字符串类型。

- keyboard

    玩家发送键盘事件，代表用户进行的操作。

    - key : str
        按下或松开的键的名称，例如 'w', 'a', 's', 'd'。
    - down : bool
        键是否被按下，true 表示按下，false 表示松开。

- mouse_pos

    玩家发送鼠标位置

    - x : int
        鼠标在世界坐标系中的 X 坐标。
    - y : int
        鼠标在世界坐标系中的 Y 坐标。

- mouse

    玩家发送鼠标事件，代表用户进行的操作。

    - button : str
        鼠标按钮 ID，0 表示左键，1 表示中键，2 表示右键，3 表示中键滚轮
    - down : bool
        鼠标按钮是否被按下，true 表示按下，false 表示松开。
    - direction : str
        仅当 button 为 3 时有该字段，表示鼠标滚轮的滚动方向，'up' 表示向上滚动，'down' 表示向下滚动。

- login

    玩家发送登录请求，服务器验证玩家身份。

    - username : str
        玩家用户名。
    - password : str
        玩家密码，经过加密处理。

## 服务器响应

- server_info

    服务器响应服务器信息请求，发送当前服务器的状态。

    - level_list : List[Object]
        服务器上正在运行的地图列表。
        - id : str
            地图的 UUID。
        - name : str
            地图的名称。
        - player_count : int
            当前地图上的玩家数量。

    - player_count : int
        服务器上当前连接的玩家数量。

- global_sync

    服务器响应同步请求，发送当前游戏状态的全局同步信息。

    - player_id : str
        目前所操作玩家的 UUID。
    - id : str
        地图的 UUID
    - name : str
        地图的名称
    - map : Map
        包含地图信息的 Map 对象
    - players : Dict[Player]
        所有玩家的信息列表。
    - entities : Dict[Entity]
        所有实体的信息列表。

- chat

    服务器响应聊天消息，将玩家的聊天内容广播给所有连接的客户端。

    - player_name : str
        发送聊天消息的玩家名称。

    - content : str
        聊天内容，字符串类型。

- update_player

    服务器响应玩家状态更新，发送玩家的最新状态。

    - player : Player
        玩家对象，必然包含 id 字段，其它字段可选是否包含，更新时所包含字段将会覆盖旧的字段

- update_entity

    服务器响应实体更新，发送实体的最新状态。

    - entity : Entity
        更新后的 Entity 对象，包含其坐标和属性。

- delete_entity

    服务器广播删除实体更新，发送删除结果。

    - entity_id : str
        被删除的实体的 UUID。

- update_tile

    服务器响应地图块更新，发送地图块的最新状态。

    - chunkX : int
        区块的 X 坐标。
    - chunkY : int
        区块的 Y 坐标。

    - tile : Tile
        更新后的 Tile 对象，包含其坐标和属性。

- login_callback

    服务器响应登录请求，返回登录结果。

    - success : bool
        登录是否成功。
    - reason : str
        登录失败的原因，仅在 success 为 false 时存在。

- join_level_callback

    服务器响应加入地图请求，返回加入结果。

    - success : bool
        加入地图是否成功。
    - info : str
        额外信息