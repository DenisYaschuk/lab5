window.onload = function(){
    startPosition = [
        ['G', 'G', 'G', 'G', 'M'],
        ['G', 'G', 'G', 'G', 'G'],
        ['G', 'G', 'M', 'G', 'G'],
        ['G', 'G', 'G', 'G', 'G'],
        ['M', 'G', 'G', 'G', 'G']
    ];
    Orthogonal_moves = [[1,0],[-1,0],[0,-1],[0,1]];
    memo_maximizer_max_value = {};
    memo_maximizer_min_value = {};
    memo_minimizer_max_value = {};
    memo_minimizer_min_value = {};
    memorization = 1;
    count_memo_minimizer_max_value = 0;
    count_memo_minimizer_min_value = 0;
    count_memo_maximizer_max_value = 0;
    count_memo_maximizer_min_value = 0;
    count_alpha_prunning = 0;
    count_beta_prunning = 0;
    max_depth_maximizer = 0;
    max_depth_minimizer = 0;
    function init_table_zobrist(){
        min = 0;
        max = Math.pow(2,64);
        for(var i = 0; i < 5; i++){
            for(var j = 0; j < 5; j++){
                for(var k = 0; k < 2; k++){
                    ZobristTable[i][j][k] = min + Math.floor(Math.random() * (max - min + 1));
                }
            }
        }           
    }

    ZobristTable = [
        [[0,0],[0,0],[0,0],[0,0],[0,0]],
        [[0,0],[0,0],[0,0],[0,0],[0,0]],
        [[0,0],[0,0],[0,0],[0,0],[0,0]],
        [[0,0],[0,0],[0,0],[0,0],[0,0]],
        [[0,0],[0,0],[0,0],[0,0],[0,0]]
        ];

    init_table_zobrist();

    function compute_hash(board){
        h = 0
        for(var i = 0; i < 5; i++){
            for(var j = 0; j < 5; j++){
                if(board[i][j] != ' '){
                    piece = board[i][j] == 'M' ? 0 : 1
                    h ^= ZobristTable[i][j][piece]
                } 
            }
        }
        return h
    }
    function copyArr(currentArray){
        var newArray = [];
        for (var i = 0; i < currentArray.length; i++){
            newArray[i] = currentArray[i].slice();
        }
        return newArray;
    }
    function possible_actions(state){
        List = [];
        board = [];
        count = 0;
        if(state.to_move == 'M' && count <= 3){
            for(var x = 0; x < 5; x++){
                for(var y = 0; y < 5; y++){
                    if(state.board[x][y] == 'M'){
                        count += 1;
                        for(pair of Orthogonal_moves){;
                            if(x+pair[0]>=0 && x+pair[0]<=4 && y+pair[1]>=0 && y+pair[1]<=4){
                                if(state.board[x+pair[0]][y+pair[1]] == 'G'){                                                                            
                                    board =  copyArr(state.board);
                                    board[x][y] = ' ';
                                    board[x+pair[0]][y+pair[1]] = 'M';
                                    List.push(board);
                                }
                            }
                            
                        }       
                    }    
                }
            }   
        }           
        else if(state.to_move == 'G'){
            for(var i = 0; i < 5; i++){
                for(var j = 0; j < 5; j++){
                    if(state.board[i][j] == 'G'){
                        for( pair of Orthogonal_moves){
                            if(i+pair[0]>=0 && i+pair[0]<=4 && j+pair[1]>=0 && j+pair[1]<=4){
                                if(state.board[i+pair[0]][j+pair[1]] == ' '){
                                    board =  copyArr(state.board);
                                    board[i][j] = ' ';
                                    board[i+pair[0]][j+pair[1]] = 'G';
                                    List.push(board);
                                }
                            }  
                        }
                    }    
                }
            }
        }
        return List
    }
    function compute_utility_for_move(board){
        Musketeers_positions = []
        for(var i = 0; i < 5; i++){
            for(var j = 0; j < 5; j++){
                if(board[i][j] == 'M'){
                    Musketeers_positions.push([i,j]);
                }  
            }
        }
        if(Musketeers_positions[0][0] == Musketeers_positions[1][0] && Musketeers_positions[1][0] == Musketeers_positions[2][0]){
            return -1;
        }  
        if(Musketeers_positions[0][1] == Musketeers_positions[1][1] && Musketeers_positions[1][1] == Musketeers_positions[2][1]){
            return -1;
        }
        for(position of Musketeers_positions){
            for(pair of Orthogonal_moves){
                if(position[0]+pair[0]>=0 && position[0]+pair[0]<=4 && position[1]+pair[1]>=0 && position[1]+pair[1]<=4){
                    if(board[position[0]+pair[0]][position[1]+pair[1]] == 'G'){
                        return 0;
                    }
                }
            }
        }
        return 1;
    }
    function check_result(state, move){
        return {to_move: state.to_move == 'G' ? 'M' : 'G', utility:compute_utility_for_move(move), board:move};
    }
    function check_terminal_test(state){
        return state.utility == 0 ? 0 : 1;
    }   
    function check_utility(state, player){
        return player == 'M' ? state.utility : -state.utility
    }
    function alphabetaPrunningDifficult(state){
        player = 'M';
        function max(a,b){
            return a > b ? a : b;
        }
        function min(a,b){
            return a < b ? a : b;
        }
        function max_value(state, alpha, beta,depth){
            if (check_terminal_test(state)){
                return check_utility(state, player)
            }                
            v = -Infinity
            player_about_to_move = state.to_move == 'G' ? 'M' : 'G';
            statehash = compute_hash(state.board)
            
            if(player_about_to_move == 'M' && statehash in memo_maximizer_max_value && memorization){
                count_memo_maximizer_max_value = count_memo_maximizer_max_value + 1;
                return memo_maximizer_max_value[statehash];
            }                
            else if(player_about_to_move == 'G' && statehash in memo_minimizer_max_value && memorization){
                count_memo_minimizer_max_value = count_memo_minimizer_max_value + 1;
                return memo_minimizer_max_value[statehash];
            }
                
            for (a of possible_actions(state)){
                v = max(v, min_value(check_result(state, copyArr(a)), alpha, beta,depth+1)) 
                if (v >= beta || (v == 1 && player == 'M')){
                    count_beta_prunning = count_beta_prunning + 1
                    if(player_about_to_move == 'M' && memorization){
                        max_depth_maximizer = max(depth+1,max_depth_maximizer);
                        memo_maximizer_max_value[statehash] = v;
                    }
                    else if(player_about_to_move == 'G' && memorization){
                        max_depth_minimizer = max(depth+1, max_depth_minimizer)
                        memo_minimizer_max_value[statehash] = v
                    }
                    return v
                }
                alpha = max(alpha, v)
            }
            if(player_about_to_move == 'M' && memorization){
                max_depth_maximizer = max(depth+1,max_depth_maximizer)
                memo_maximizer_max_value[statehash] = v
            }
            else if(player_about_to_move == 'G' && memorization){
                max_depth_minimizer = max(depth+1, max_depth_minimizer)
                memo_minimizer_max_value[statehash] = v
            }
            return v
        }
        function min_value(state, alpha, beta, depth){

            if (check_terminal_test(state)){
                return check_utility(state, player);
            }

            statehash = compute_hash(state.board)
            v = Infinity
            player_about_to_move =  state.to_move == 'G' ? 'M' : 'G'
            if(player_about_to_move == 'M' && statehash in memo_maximizer_min_value & memorization){
                count_memo_maximizer_min_value = count_memo_maximizer_min_value + 1
                return memo_maximizer_min_value[statehash]
            }
                
            else if(player_about_to_move == 'G' && statehash in memo_minimizer_min_value && memorization){
                count_memo_minimizer_min_value = count_memo_minimizer_min_value + 1
                return memo_minimizer_min_value[statehash]
            }
            for (a of possible_actions(state)){
                v = min(v, max_value(check_result(state, copyArr(a)), alpha, beta,depth+1))
                if (v <= alpha || (v == 1 && player == 'M')){
                    count_alpha_prunning = count_alpha_prunning + 1
                    if(player_about_to_move == 'M' && memorization){
                        max_depth_maximizer = max(depth+1,max_depth_maximizer)
                        memo_maximizer_min_value[statehash] = v
                    }
                    else if(player_about_to_move == 'G' && memorization){
                        max_depth_minimizer = max(depth+1, max_depth_minimizer)
                        memo_minimizer_min_value[statehash] = v
                    }
                    return v
                }
                beta = min(beta, v)
            }
            if(player_about_to_move == 'M' && memorization){
                max_depth_maximizer = max(depth+1,max_depth_maximizer)
                memo_maximizer_min_value[statehash] = v
            }
            else if(player_about_to_move == 'G' && memorization){
                max_depth_minimizer = max(depth+1, max_depth_minimizer)
                memo_minimizer_min_value[statehash] = v
            }
            return v
        }
        best_score = -Infinity
        beta = Infinity
        best_action = null;
        possible_moves = possible_actions(state);
        for (var i = 0; i < possible_moves.length; i++){
            v = min_value(check_result(state, copyArr(possible_moves[i])), best_score, beta,0);            
            if( v == 1 && player == 'M' || v == -1 && player == 'G'){
                best_score = v
                best_action = copyArr(possible_moves[i]);
                break
            }
            if(v > best_score){
                best_score = v
                best_action = copyArr(possible_moves[i]);
            }
        };
        return best_action
    }
    function alphabetaPrunningMedium(state){
        player = 'M';
        function max(a,b){
            return a > b ? a : b;
        }
        function min(a,b){
            return a < b ? a : b;
        }
        function max_value(state, alpha, beta,depth){
            if (check_terminal_test(state)){
                return check_utility(state, player)
            }                
            v = -Infinity
            player_about_to_move = state.to_move == 'G' ? 'M' : 'G';
            statehash = compute_hash(state.board)
            
            if(player_about_to_move == 'M' && statehash in memo_maximizer_max_value && memorization){
                count_memo_maximizer_max_value = count_memo_maximizer_max_value + 1;
                return memo_maximizer_max_value[statehash];
            }                
            else if(player_about_to_move == 'G' && statehash in memo_minimizer_max_value && memorization){
                count_memo_minimizer_max_value = count_memo_minimizer_max_value + 1;
                return memo_minimizer_max_value[statehash];
            }
                
            for (a of possible_actions(state)){
                if(depth+1>2){
                    return v;
                }
                v = max(v, min_value(check_result(state, copyArr(a)), alpha, beta,depth+1)) 
                if (v >= beta || (v == 1 && player == 'M')){
                    count_beta_prunning = count_beta_prunning + 1
                    if(player_about_to_move == 'M' && memorization){
                        max_depth_maximizer = max(depth+1,max_depth_maximizer);
                        memo_maximizer_max_value[statehash] = v;
                    }
                    else if(player_about_to_move == 'G' && memorization){
                        max_depth_minimizer = max(depth+1, max_depth_minimizer)
                        memo_minimizer_max_value[statehash] = v
                    }
                    return v
                }
                alpha = max(alpha, v)
            }
            if(player_about_to_move == 'M' && memorization){
                max_depth_maximizer = max(depth+1,max_depth_maximizer)
                memo_maximizer_max_value[statehash] = v
            }
            else if(player_about_to_move == 'G' && memorization){
                max_depth_minimizer = max(depth+1, max_depth_minimizer)
                memo_minimizer_max_value[statehash] = v
            }
            return v
        }
        function min_value(state, alpha, beta, depth){
            
            if (check_terminal_test(state)){
                return check_utility(state, player);
            }

            statehash = compute_hash(state.board)
            v = Infinity
            player_about_to_move =  state.to_move == 'G' ? 'M' : 'G'
            if(player_about_to_move == 'M' && statehash in memo_maximizer_min_value & memorization){
                count_memo_maximizer_min_value = count_memo_maximizer_min_value + 1
                return memo_maximizer_min_value[statehash]
            }
                
            else if(player_about_to_move == 'G' && statehash in memo_minimizer_min_value && memorization){
                count_memo_minimizer_min_value = count_memo_minimizer_min_value + 1
                return memo_minimizer_min_value[statehash]
            }
            for (a of possible_actions(state)){
                if(depth+1>2){
                    return v;
                }
                v = min(v, max_value(check_result(state, copyArr(a)), alpha, beta,depth+1))
                if (v <= alpha || (v == 1 && player == 'M')){
                    count_alpha_prunning = count_alpha_prunning + 1
                    if(player_about_to_move == 'M' && memorization){
                        max_depth_maximizer = max(depth+1,max_depth_maximizer)
                        memo_maximizer_min_value[statehash] = v
                    }
                    else if(player_about_to_move == 'G' && memorization){
                        max_depth_minimizer = max(depth+1, max_depth_minimizer)
                        memo_minimizer_min_value[statehash] = v
                    }
                    return v
                }
                beta = min(beta, v)
            }
            if(player_about_to_move == 'M' && memorization){
                max_depth_maximizer = max(depth+1,max_depth_maximizer)
                memo_maximizer_min_value[statehash] = v
            }
            else if(player_about_to_move == 'G' && memorization){
                max_depth_minimizer = max(depth+1, max_depth_minimizer)
                memo_minimizer_min_value[statehash] = v
            }
            return v
        }
        best_score = -Infinity
        beta = Infinity
        best_action = null;
        possible_moves = possible_actions(state);
        for (var i = 0; i < possible_moves.length; i++){
            v = min_value(check_result(state, copyArr(possible_moves[i])), best_score, beta,0);            
            if( v == 1 && player == 'M' || v == -1 && player == 'G'){
                best_score = v
                best_action = copyArr(possible_moves[i]);
                break
            }
            if(v > best_score){
                best_score = v
                best_action = copyArr(possible_moves[i]);
            }
        };
        return best_action
    }
    function PlayerWin() {
        for(var i = 0; i < 5; i++){
            countInRow = 0;
            for(var j = 0; j < 5; j++){
                if(startPosition[i][j]=='M'){
                    countInRow++;
                }
                if(countInRow==3){
                    return true;
                }
            }
        }
        for(var i = 0; i < 5; i++){
            countInRow = 0;
            for(var j = 0; j < 5; j++){
                if(startPosition[j][i]=='M'){
                    countInRow++;
                }
                if(countInRow==3){
                    return true;
                }
            }
        }
        return false;
    }
    function ComputerWin() {
        isMovePossible = false;        
        for(var i = 0; i < 5; i++){
            for(var j = 0; j < 5; j++){
                if(startPosition[i][j]=='M'){
                    if(( j>0 && j<4) && (startPosition[i][j-1]=='G' || startPosition[i][j+1]=='G')){
                        isMovePossible = true;
                    }
                    if(j==0 && startPosition[i][j+1]=='G'){
                        isMovePossible = true;
                    }
                    if(j==4 && startPosition[i][j-1]=='G'){
                        isMovePossible = true;
                    }
                    if((i>0 && i<4) && (startPosition[i-1][j]=='G' || startPosition[i+1][j]=='G')){
                        isMovePossible = true;
                    }
                    if(i==0 && startPosition[i+1][j]=='G'){
                        isMovePossible = true;
                    }
                    if(i==4 && startPosition[i-1][j]=='G'){
                        isMovePossible = true;
                    }
                }
            }
        }
        return !isMovePossible;;
    }
    function redrawBoard(){
        if((ComputerWin() && isComputerTurn) || !startPosition.some(el => el.includes('G'))){            
            $("#board").fadeOut("slow");
            $("#computerWon").fadeIn("slow");
            document.getElementById('computerWon').style.display = 'flex';
        }
        else if((PlayerWin() && !isComputerTurn)){
            $("#board").fadeOut("slow");
            $("#playerWon").fadeIn("slow");
            document.getElementById('playerWon').style.display = 'flex'
        }
        else{
            cells = document.getElementsByClassName("cell");        
            Array.prototype.forEach.call(cells, function(el){
                el.addEventListener('click',function(e){
                    if(difficultyLevel==1){
                        if(isComputerTurn && el.children[0].classList.contains("mushketeer")){
                            Array.prototype.forEach.call(cells, function(cell){
                                cell.children[0].style.border = "0";
                            });
                            el.children[0].style.border = "2px solid green";
                            currentSelected[0] = el.parentNode.rowIndex;
                            currentSelected[1] = el.cellIndex;
                        }
                        else if (isComputerTurn && el.children[0].classList.contains("enemy") && currentSelected.length !== 0 && currentSelected[0] != -1){
                            if( (el.cellIndex==currentSelected[1] && (el.parentNode.rowIndex-1==currentSelected[0] || el.parentNode.rowIndex+1==currentSelected[0])) ||
                                (el.parentNode.rowIndex==currentSelected[0] && (el.cellIndex-1==currentSelected[1] || el.cellIndex+1==currentSelected[1])) ){
                                startPosition[el.parentNode.rowIndex][el.cellIndex] = 'M';
                                startPosition[currentSelected[0]][currentSelected[1]] = ' ';
                                currentSelected = [];
                                isComputerTurn = false;
                                drawTable(startPosition);
                                redrawBoard();
                            }                            
                        }
                        else if (!isComputerTurn && el.children[0].classList.contains("enemy")){
                            Array.prototype.forEach.call(cells, function(cell){
                                cell.children[0].style.border = "0";
                            });
                            el.children[0].style.border = "2px solid green";
                            currentSelected[0] = el.parentNode.rowIndex;
                            currentSelected[1] = el.cellIndex;
                        }
                        else if (!isComputerTurn && !el.children[0].classList.contains("enemy") && !el.children[0].classList.contains("mushketeer") && currentSelected.length !== 0 && currentSelected[0] != -1){
                            if( (el.cellIndex==currentSelected[1] && (el.parentNode.rowIndex-1==currentSelected[0] || el.parentNode.rowIndex+1==currentSelected[0])) ||
                                (el.parentNode.rowIndex==currentSelected[0] && (el.cellIndex-1==currentSelected[1] || el.cellIndex+1==currentSelected[1])) ){
                                startPosition[el.parentNode.rowIndex][el.cellIndex] = 'G';
                                startPosition[currentSelected[0]][currentSelected[1]] = ' ';
                                currentSelected = [];
                                isComputerTurn = true;
                                drawTable(startPosition);
                                redrawBoard();
                            }
                        }
                    }
                    if(difficultyLevel==2){
                        if(isComputerTurn){
                            initial_state_standard_three_musketeers = {to_move : 'M', utility : 0, board : startPosition};
                            startPosition = copyArr(alphabetaPrunningMedium(initial_state_standard_three_musketeers));
                            currentSelected = [];
                            isComputerTurn = false;
                            drawTable(startPosition);
                            redrawBoard();
                        }
                        else if (!isComputerTurn && el.children[0].classList.contains("enemy")){
                            Array.prototype.forEach.call(cells, function(cell){
                                cell.children[0].style.border = "0";
                            });
                            el.children[0].style.border = "2px solid green";
                            currentSelected[0] = el.parentNode.rowIndex;
                            currentSelected[1] = el.cellIndex;
                        }
                        else if (!isComputerTurn && !el.children[0].classList.contains("enemy") && !el.children[0].classList.contains("mushketeer") && currentSelected.length !== 0 && currentSelected[0] != -1){
                            if( (el.cellIndex==currentSelected[1] && (el.parentNode.rowIndex-1==currentSelected[0] || el.parentNode.rowIndex+1==currentSelected[0])) ||
                                (el.parentNode.rowIndex==currentSelected[0] && (el.cellIndex-1==currentSelected[1] || el.cellIndex+1==currentSelected[1])) ){
                                startPosition[el.parentNode.rowIndex][el.cellIndex] = 'G';
                                startPosition[currentSelected[0]][currentSelected[1]] = ' ';
                                currentSelected = [];
                                isComputerTurn = true;
                                drawTable(startPosition);
                                redrawBoard();
                            }
                        }        
                    }    
                    if(difficultyLevel==3){
                        if(isComputerTurn){
                            initial_state_standard_three_musketeers = {to_move : 'M', utility : 0, board : startPosition};
                            startPosition = copyArr(alphabetaPrunningDifficult(initial_state_standard_three_musketeers));
                            currentSelected = [];
                            isComputerTurn = false;
                            drawTable(startPosition);
                            redrawBoard();
                        }
                        else if (!isComputerTurn && el.children[0].classList.contains("enemy")){
                            Array.prototype.forEach.call(cells, function(cell){
                                cell.children[0].style.border = "0";
                            });
                            el.children[0].style.border = "2px solid green";
                            currentSelected[0] = el.parentNode.rowIndex;
                            currentSelected[1] = el.cellIndex;
                        }
                        else if (!isComputerTurn && !el.children[0].classList.contains("enemy") && !el.children[0].classList.contains("mushketeer") && currentSelected.length !== 0 && currentSelected[0] != -1){
                            if( (el.cellIndex==currentSelected[1] && (el.parentNode.rowIndex-1==currentSelected[0] || el.parentNode.rowIndex+1==currentSelected[0])) ||
                                (el.parentNode.rowIndex==currentSelected[0] && (el.cellIndex-1==currentSelected[1] || el.cellIndex+1==currentSelected[1])) ){
                                startPosition[el.parentNode.rowIndex][el.cellIndex] = 'G';
                                startPosition[currentSelected[0]][currentSelected[1]] = ' ';
                                currentSelected = [];
                                isComputerTurn = true;
                                drawTable(startPosition);
                                redrawBoard();
                            }
                        }                
                    }
                        
                });
            })
            window.addEventListener('click', function(e){   
                if (!document.getElementById('board').contains(e.target)){
                    Array.prototype.forEach.call(cells, function(cell){
                        cell.children[0].style.border = "0";
                    });
                    if(currentSelected[0] != -1){
                        currentSelected = [];
                    }
                }
            });
        }        
    }
    function drawTable(position){
        boardTable.innerHTML = "";
        var tblBody = document.createElement("tbody");
        for (var i = 0; i < 5; i++) {
          var row = document.createElement("tr");
          for (var j = 0; j < 5; j++) {
            var cell = document.createElement("td");
            cell.classList = "cell";
            var cellText = document.createElement("div");
            if(startPosition[i][j] == ' '){
                cellText.classList = "chip";
            }
            else if (startPosition[i][j] == 'G'){
                cellText.classList = "chip enemy";
            }
            else if (startPosition[i][j] == 'M'){
                cellText.classList = "chip mushketeer";
            }
            cell.appendChild(cellText);
            row.appendChild(cell);
          }
          tblBody.appendChild(row);
        }
        boardTable.appendChild(tblBody);
    }
    easyButton = document.getElementById('easyButton');
    mediumButton = document.getElementById('mediumButton');
    diffucltButton = document.getElementById('diffucltButton');
    boardTable = document.getElementById('board');
    diffucltyLevelChoice = document.getElementById('diffucltyLevelChoice');
    restartButtonP = document.getElementById('restartButtonP');
    restartButtonC = document.getElementById('restartButtonC');
    difficultyLevel = 0;
    easyButton.addEventListener('click', function(e){
        difficultyLevel = 1;
        $("#diffucltyLevelChoice").fadeOut("slow");
        $("#board").fadeIn("slow");
    });
    mediumButton.addEventListener('click', function(e){
        difficultyLevel = 2;
        $("#diffucltyLevelChoice").fadeOut("slow");
        $("#board").fadeIn("slow");
    });
    diffucltButton.addEventListener('click', function(e){
        difficultyLevel = 3;
        $("#diffucltyLevelChoice").fadeOut("slow");
        $("#board").fadeIn("slow");
    });
    restartButtonP.addEventListener('click', function(e){
        document.location.reload();
    });
    restartButtonC.addEventListener('click', function(e){
        document.location.reload();
    });
    isComputerTurn = true;
    currentSelected = [-1,-1];
    redrawBoard();
}