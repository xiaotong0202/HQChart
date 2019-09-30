/*
    copyright (c) 2018 jones

    http://www.apache.org/licenses/LICENSE-2.0

    开源项目 https://github.com/jones2000/HQChart

    jones_2000@163.com

    坐标轴相关算法
*/

import 
{
    JSCommonResource_Global_JSChartResource as g_JSChartResource,
} from './umychart.resource.wechat.js'

import { JSCommonCoordinateData as JSCommonCoordinateData } from "./umychart.coordinatedata.wechat.js";
var MARKET_SUFFIX_NAME = JSCommonCoordinateData.MARKET_SUFFIX_NAME;

//坐标信息
function CoordinateInfo() 
{
    this.Value;                                                 //坐标数据
    this.Message = new Array();                                   //坐标输出文字信息
    this.TextColor = g_JSChartResource.FrameSplitTextColor        //文字颜色
    this.Font = g_JSChartResource.FrameSplitTextFont;             //字体
    this.LineColor = g_JSChartResource.FrameSplitPen;             //线段颜色
    this.LineType = 1;                                            //线段类型 -1 不画线段
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
//坐标分割
//
//
////////////////////////////////////////////////////////////////////////////////////////////////////
function IFrameSplitOperator() 
{
    this.ChartBorder;                   //边框信息
    this.Frame;                         //框架信息
    this.FrameSplitData;                //坐标轴分割方法
    this.SplitCount = 5;                  //刻度个数
    this.StringFormat = 0;                //刻度字符串格式 -1 刻度文字全部不显示 -2 刻度文字右边不显示

    //////////////////////
    // data.Min data.Max data.Interval data.Count
    //
    this.IntegerCoordinateSplit = function (data) 
    {
        var splitItem = this.FrameSplitData.Find(data.Interval);
        if (!splitItem) return false;

        if (data.Interval == splitItem.Interval) return true;

        //调整到整数倍数,不能整除的 +1
        var fixMax = parseInt((data.Max / (splitItem.FixInterval) + 0.5).toFixed(0)) * splitItem.FixInterval;
        var fixMin = parseInt((data.Min / (splitItem.FixInterval) - 0.5).toFixed(0)) * splitItem.FixInterval;
        if (data.Min == 0) fixMin = 0;  //最小值是0 不用调整了.
        if (fixMin < 0 && data.Min > 0) fixMin = 0;   //都是正数的, 最小值最小调整为0

        var count = 0;
        for (var i = fixMin; (i - fixMax) < 0.00000001; i += splitItem.FixInterval) {
            ++count;
        }

        data.Interval = splitItem.FixInterval;
        data.Max = fixMax;
        data.Min = fixMin;
        data.Count = count;

        return true;
    }

    this.Filter = function (aryInfo, keepZero)   //keepZero 保留0轴
    {
        if (this.SplitCount <= 0 || aryInfo.length <= 0 || aryInfo.length < this.SplitCount) return aryInfo;

        //分割线比预设的多, 过掉一些
        var filter = parseInt(aryInfo.length / this.SplitCount);
        if (filter <= 1) filter = 2;
        var data = [];

        for (var i = 0; i < aryInfo.length; i += filter) 
        {
            if (i + filter >= aryInfo.length && i != aryInfo.length - 1) //最后一个数据放进去
            {
                data.push(aryInfo[aryInfo.length - 1]);
            }
            else {
                data.push(aryInfo[i]);
            }
        }

        if (this.SplitCount == 2 && data.length > 2) //之显示第1个和最后一个刻度
        {
            for (var i = 1; i < data.length - 1; ++i) 
            {
                var item = data[i];
                item.Message[0] = null;
                item.Message[1] = null;
            }
        }

        if (keepZero)   //如果不存在0轴,增加一个0轴,刻度信息部显示
        {
            var bExsitZero = false;
            for (var i = 0; i < data; ++i) 
            {
                var item = data[i];
                if (Math.abs(item.Value) < 0.00000001) 
                {
                    bExsitZero = true;
                    break;
                }
            }

            if (bExsitZero == false) 
            {
                var zeroCoordinate = new CoordinateInfo();
                zeroCoordinate.Value = 0;
                zeroCoordinate.Message[0] = null
                zeroCoordinate.Message[1] = null;
                data.push(zeroCoordinate);
            }
        }

        return data;
    }

    this.RemoveZero = function (aryInfo)   //移除小数后面多余的0
    {
        //所有的数字小数点后面都0,才会去掉
        var isAllZero = [true, true];
        for (var i in aryInfo) {
            var item = aryInfo[i];
            var message = item.Message[0];
            if (!this.IsDecimalZeroEnd(message)) isAllZero[0] = false;

            var message = item.Message[1];
            if (!this.IsDecimalZeroEnd(message)) isAllZero[1] = false;
        }

        if (isAllZero[0] == false && isAllZero[1] == false) return;
        for (var i in aryInfo) 
        {
            var item = aryInfo[i];
            if (isAllZero[0]) 
            {
                var message = item.Message[0];
                if (message != null) 
                {
                    if (typeof (message) == 'number') message = message.toString();
                    item.Message[0] = message.replace(/[.][0]+/g, '');
                }
            }

            if (isAllZero[1]) 
            {
                var message = item.Message[1];
                if (message != null) 
                {
                    if (typeof (message) == 'number') message = message.toString();
                    item.Message[1] = message.replace(/[.][0]+/g, '');
                }
            }
        }
    }

    this.IsDecimalZeroEnd = function (text)   //是否是0结尾的小数
    {
        if (text == null) return true;
        if (text == '0') return true;
        if (typeof (text) == 'number') text = text.toString();

        var pos = text.search(/[.]/);
        if (pos < 0) return false;

        for (var i = pos + 1; i < text.length; ++i) 
        {
            var char = text.charAt(i);
            if (char >= '1' && char <= '9') return false;
        }

        return true;
    }
}

//字符串格式化 千分位分割
IFrameSplitOperator.FormatValueThousandsString = function (value, floatPrecision) 
{
    if (value == null || isNaN(value)) 
    {
        if (floatPrecision > 0) 
        {
            var nullText = '-.';
            for (var i = 0; i < floatPrecision; ++i)
                nullText += '-';
            return nullText;
        }

        return '--';
    }

    var result = '';
    var num = value.toFixed(floatPrecision);
    while (num.length > 3) 
    {
        result = ',' + num.slice(-3) + result;
        num = num.slice(0, num.length - 3);
    }
    if (num) { result = num + result; }
    return result;
}

//数据输出格式化 floatPrecision=小数位数
IFrameSplitOperator.FormatValueString = function (value, floatPrecision) 
{
    if (value == null || isNaN(value)) 
    {
        if (floatPrecision > 0) 
        {
            var nullText = '-.';
            for (var i = 0; i < floatPrecision; ++i)
                nullText += '-';
            return nullText;
        }

        return '--';
    }

    if (value < 0.00000000001 && value > -0.00000000001) 
    {
        return "0";
    }

    var absValue = Math.abs(value);
    if (absValue < 10000) {
        return value.toFixed(floatPrecision);
    }
    else if (absValue < 100000000) {
        return (value / 10000).toFixed(floatPrecision) + "万";
    }
    else if (absValue < 1000000000000) {
        return (value / 100000000).toFixed(floatPrecision) + "亿";
    }
    else {
        return (value / 1000000000000).toFixed(floatPrecision) + "万亿";
    }

    return TRUE;
}

IFrameSplitOperator.NumberToString = function (value) 
{
    if (value < 10) return '0' + value.toString();
    return value.toString();
}

IFrameSplitOperator.FormatDateString = function (value, format) 
{
    var year = parseInt(value / 10000);
    var month = parseInt(value / 100) % 100;
    var day = value % 100;
    switch (format) 
    {
        case 'MM-DD':
            return IFrameSplitOperator.NumberToString(month) + '-' + IFrameSplitOperator.NumberToString(day);
        default:
            return year.toString() + '-' + IFrameSplitOperator.NumberToString(month) + '-' + IFrameSplitOperator.NumberToString(day);
    }
}

IFrameSplitOperator.FormatTimeString = function (value) 
{
    var hour = parseInt(value / 100);
    var minute = value % 100;

    return IFrameSplitOperator.NumberToString(hour) + ':' + IFrameSplitOperator.NumberToString(minute);
}

//报告格式化
IFrameSplitOperator.FormatReportDateString = function (value)
 {
    var year = parseInt(value / 10000);
    var month = parseInt(value / 100) % 100;
    var monthText;
    switch (month) {
        case 3:
            monthText = "一季度报";
            break;
        case 6:
            monthText = "半年报";
            break;
        case 9:
            monthText = "三季度报";
            break;
        case 12:
            monthText = "年报";
            break;
    }

    return year.toString() + monthText;
}

IFrameSplitOperator.FormatDateTimeString = function (value, foramt) 
{
    var aryValue = value.split(' ');
    if (aryValue.length < 2) return "";

    var time = parseInt(aryValue[1]);
    var minute = time % 100;
    var hour = parseInt(time / 100);
    var date = parseInt(aryValue[0]);
    var year = parseInt(date / 10000);
    var month = parseInt(date % 10000 / 100);
    var day = date % 100;

    switch (foramt) {
        case 'YYYY-MM-DD HH-MM':
            return year.toString() + '-' + IFrameSplitOperator.NumberToString(month) + '-' + IFrameSplitOperator.NumberToString(day) + ' ' + IFrameSplitOperator.NumberToString(hour) + ':' + IFrameSplitOperator.NumberToString(minute);
        case 'YYYY-MM-DD':
            return year.toString() + '-' + IFrameSplitOperator.NumberToString(month) + '-' + IFrameSplitOperator.NumberToString(day);
        default:
            return IFrameSplitOperator.NumberToString(hour) + ':' + IFrameSplitOperator.NumberToString(minute);

    }

    return text;
}

//K线Y轴分割
function FrameSplitKLinePriceY() 
{
    this.newMethod = IFrameSplitOperator;   //派生
    this.newMethod();
    delete this.newMethod;

    this.CoordinateType = 0;  //坐标类型 0=普通坐标  1=百分比坐标 (右边坐标刻度)
    this.Symbol;
    this.Data;              //K线数据 (计算百分比坐标)

    this.Operator = function () 
    {
        var splitData = {};
        splitData.Max = this.Frame.HorizontalMax;
        splitData.Min = this.Frame.HorizontalMin;
        splitData.Count = this.SplitCount;
        splitData.Interval = (splitData.Max - splitData.Min) / (splitData.Count - 1);
        this.IntegerCoordinateSplit(splitData);

        var defaultfloatPrecision = JSCommonCoordinateData.GetfloatPrecision(this.Symbol);
        if (JSCommonCoordinateData.MARKET_SUFFIX_NAME.IsSHSZIndex(this.Symbol)) defaultfloatPrecision = 0;    //手机端指数不显示小数位数,

        var firstOpenPrice;
        if (this.CoordinateType == 1) firstOpenPrice = this.GetFirstOpenPrice();
        this.Frame.HorizontalInfo = [];
        for (var i = 0, value = splitData.Min; i < splitData.Count; ++i, value += splitData.Interval) 
        {
            this.Frame.HorizontalInfo[i] = new CoordinateInfo();
            this.Frame.HorizontalInfo[i].Value = value;
            this.Frame.HorizontalInfo[i].Message[0] = value.toFixed(defaultfloatPrecision);
            this.Frame.HorizontalInfo[i].Message[1] = this.Frame.HorizontalInfo[i].Message[0];
            if (this.CoordinateType == 1 && firstOpenPrice) //百分比坐标 (TODO:需要重新切分坐标,不然显示的百分比不好看)
            {
                var perValue = (value - firstOpenPrice) / firstOpenPrice * 100;
                this.Frame.HorizontalInfo[i].Message[1] = perValue.toFixed(2) + '%';
            }
        }

        this.Frame.HorizontalInfo = this.Filter(this.Frame.HorizontalInfo, false);
        this.Frame.HorizontalMax = splitData.Max;
        this.Frame.HorizontalMin = splitData.Min;
    }

    this.GetFirstOpenPrice = function ()   //获取显示第1个数据的开盘价
    {
        if (!this.Data) return null;
        var xPointCount = this.Frame.XPointCount;
        for (var i = this.Data.DataOffset, j = 0; i < this.Data.Data.length && j < xPointCount; ++i, ++j) 
        {
            var data = this.Data.Data[i];
            if (data.Open == null || data.High == null || data.Low == null || data.Close == null) continue;

            return data.Open;
        }
        return null;
    }

}

//一般的Y轴分割
function FrameSplitY() 
{
    this.newMethod = IFrameSplitOperator;   //派生
    this.newMethod();
    delete this.newMethod;
    this.FloatPrecision = 2;                  //坐标小数位数(默认2)
    this.FLOATPRECISION_RANGE = [1, 0.1, 0.01, 0.001, 0.0001];
    this.IgnoreYValue = null;                 //在这个数组里的数字不显示在刻度上 

    this.IsShowYZero = true;
    this.IntegerSplitData = null;

    this.Operator = function () 
    {
        var splitData = {};
        splitData.Max = this.Frame.HorizontalMax;
        splitData.Min = this.Frame.HorizontalMin;
        if (this.Frame.YSpecificMaxMin) 
        {
            splitData.Count = this.Frame.YSpecificMaxMin.Count;
            splitData.Interval = (splitData.Max - splitData.Min) / (splitData.Count - 1);
        }
        else 
        {
            splitData.Count = this.SplitCount * 2;  //放大两倍
            if (this.FloatPrecision == 0)       //页面配置了纵坐标小数位数FloatPrecision=0时执行
            {
                splitData.Interval = (splitData.Max - splitData.Min) / (splitData.Count - 1);
                this.IntegerCoordinateSplit2(splitData);
            }
            else {
                splitData.Interval = (splitData.Max - splitData.Min) / (splitData.Count - 1);
                this.IntegerCoordinateSplit(splitData);
            }
        }

        this.Frame.HorizontalInfo = [];
        if (this.Frame.YSplitScale) 
        {
            for (var i in this.Frame.YSplitScale) 
            {
                var value = this.Frame.YSplitScale[i];
                var coordinate = new CoordinateInfo();
                coordinate.Value = value;

                var absValue = Math.abs(value);
                var floatPrecision = this.FloatPrecision;   //数据比小数位数还小, 调整小数位数
                if (absValue < 0.0000000001)
                    coordinate.Message[1] = 0;
                else if (absValue < this.FLOATPRECISION_RANGE[this.FLOATPRECISION_RANGE.length - 1])
                    coordinate.Message[1] = value.toExponential(2).toString();
                else 
                {
                    if (floatPrecision < this.FLOATPRECISION_RANGE.length && absValue < this.FLOATPRECISION_RANGE[floatPrecision])++floatPrecision;
                    if (floatPrecision < this.FLOATPRECISION_RANGE.length && absValue < this.FLOATPRECISION_RANGE[floatPrecision])++floatPrecision;
                    if (floatPrecision < this.FLOATPRECISION_RANGE.length && absValue < this.FLOATPRECISION_RANGE[floatPrecision])++floatPrecision;
                    coordinate.Message[1] = IFrameSplitOperator.FormatValueString(value, floatPrecision);
                }
                coordinate.Message[0] = coordinate.Message[1];

                if (this.StringFormat == -2) coordinate.Message[1] = null;    //刻度右边不显示
                else if (this.StringFormat == -3) coordinate.Message[0] = null;   //刻度左边不显示
                else if (this.StringFormat == -1) coordinate.Message[0] = coordinate.Message[1] = null;   //刻度左右都不显示

                this.Frame.HorizontalInfo.push(coordinate);
            }
        }
        else 
        {
            for (var i = 0, value = splitData.Min; i < splitData.Count; ++i, value += splitData.Interval) 
            {
                this.Frame.HorizontalInfo[i] = new CoordinateInfo();
                this.Frame.HorizontalInfo[i].Value = value;

                if (this.StringFormat == 1)   //手机端格式 如果有万,亿单位了 去掉小数
                {
                    var floatPrecision = this.FloatPrecision;
                    if (!isNaN(value) && Math.abs(value) > 1000) floatPrecision = 0;
                    this.Frame.HorizontalInfo[i].Message[1] = IFrameSplitOperator.FormatValueString(value, floatPrecision);
                }
                else if (this.StringFormat == -1) //刻度不显示
                {

                }
                else 
                {
                    var absValue = Math.abs(value);
                    var floatPrecision = this.FloatPrecision;   //数据比小数位数还小, 调整小数位数
                    if (absValue < 0.0000000001)
                        this.Frame.HorizontalInfo[i].Message[1] = 0;
                    else if (absValue < this.FLOATPRECISION_RANGE[this.FLOATPRECISION_RANGE.length - 1])
                        this.Frame.HorizontalInfo[i].Message[1] = value.toExponential(2).toString();
                    else {
                        if (floatPrecision < this.FLOATPRECISION_RANGE.length && absValue < this.FLOATPRECISION_RANGE[floatPrecision])++floatPrecision;
                        if (floatPrecision < this.FLOATPRECISION_RANGE.length && absValue < this.FLOATPRECISION_RANGE[floatPrecision])++floatPrecision;
                        if (floatPrecision < this.FLOATPRECISION_RANGE.length && absValue < this.FLOATPRECISION_RANGE[floatPrecision])++floatPrecision;
                        this.Frame.HorizontalInfo[i].Message[1] = IFrameSplitOperator.FormatValueString(value, floatPrecision);
                    }
                }

                this.Frame.HorizontalInfo[i].Message[0] = this.Frame.HorizontalInfo[i].Message[1];

                if (this.StringFormat == -2) this.Frame.HorizontalInfo[i].Message[1] = null;    //刻度右边不显示
                else if (this.StringFormat == -3) this.Frame.HorizontalInfo[i].Message[0] = null;   //刻度左边不显示
            }
        }

        this.FilterIgnoreYValue();
        this.Frame.HorizontalInfo = this.Filter(this.Frame.HorizontalInfo, (splitData.Max > 0 && splitData.Min < 0 && this.IsShowYZero));
        this.RemoveZero(this.Frame.HorizontalInfo);
        this.Frame.HorizontalMax = splitData.Max;
        this.Frame.HorizontalMin = splitData.Min;
    }

    this.FilterIgnoreYValue = function () 
    {
        if (!this.IgnoreYValue || this.IgnoreYValue.length <= 0) return;

        var setValue = new Set(this.IgnoreYValue);
        this.Frame.HorizontalInfo = this.Frame.HorizontalInfo.filter(item => !setValue.has(item.Value));
        this.IsShowYZero = !setValue.has(0);    //是否显示0刻度
    }

    this.IntegerCoordinateSplit2 = function (data) //整数分割
    {
        if (this.IntegerSplitData == null) this.IntegerSplitData = new IntegerSplitData();
        //最大最小调整为整数
        if (data.Max > 0) data.Max = parseInt(data.Max + 0.5);
        else if (data.Max < 0) data.Max = parseInt(data.Max - 0.5);
        if (data.Min > 0) data.Min = parseInt(data.Min - 0.5);
        else if (data.Min < 0) data.Min = parseInt(data.Min + 0.5);

        data.Interval = (data.Max - data.Min) / (data.Count - 1);
        var splitItem = this.IntegerSplitData.Find(data.Interval);
        if (!splitItem) return false;

        if (data.Interval == splitItem.Interval) return true;

        var fixMax = parseInt((data.Max / (splitItem.FixInterval) + 0.5).toFixed(0)) * splitItem.FixInterval + 0.5;
        var fixMin = parseInt((data.Min / (splitItem.FixInterval) - 0.5).toFixed(0)) * splitItem.FixInterval;
        if (data.Min == 0) fixMin = 0;
        if (fixMin < 0 && data.Min > 0) fixMin = 0;
        var count = 0;
        for (var i = fixMin; (i - fixMax) < 0.00000001; i += splitItem.FixInterval) 
        {
            ++count;
        }
        data.Interval = splitItem.FixInterval;
        data.Max = fixMax;
        data.Min = fixMin;
        data.Count = count;

        return true;
    }
}

function FrameSplitKLineX() 
{
    this.newMethod = IFrameSplitOperator;   //派生
    this.newMethod();
    delete this.newMethod;

    this.ShowText = true;                 //是否显示坐标信息
    this.MinDistance = 12;                //刻度间隔

    this.Operator = function () 
    {
        if (this.Frame.Data == null) return;
        this.Frame.VerticalInfo = [];
        var xOffset = this.Frame.Data.DataOffset;
        var xPointCount = this.Frame.XPointCount;

        var lastYear = null, lastMonth = null;

        for (var i = 0, index = xOffset, distance = this.MinDistance; i < xPointCount && index < this.Frame.Data.Data.length; ++i, ++index) 
        {
            var year = parseInt(this.Frame.Data.Data[index].Date / 10000);
            var month = parseInt(this.Frame.Data.Data[index].Date / 100) % 100;

            if ((distance < this.MinDistance && lastYear == year) ||
                (lastYear != null && lastYear == year && lastMonth != null && lastMonth == month)) 
            {
                lastMonth = month;
                ++distance;
                continue;
            }

            var info = new CoordinateInfo();
            info.Value = index - xOffset;
            //info.TextColor = "rgb(51,51,51)";
            var text;
            if (lastYear == null || lastYear != year) 
            {
                text = year.toString();
            }
            else if (lastMonth == null || lastMonth != month) 
            {
                text = month.toString() + "月";
            }

            lastYear = year;
            lastMonth = month;

            if (this.ShowText) 
            {
                info.Message[0] = text;
            }

            this.Frame.VerticalInfo.push(info);
            distance = 0;
        }
    }
}

function FrameSplitMinutePriceY() 
{
    this.newMethod = IFrameSplitOperator;   //派生
    this.newMethod();
    delete this.newMethod;

    this.YClose;                        //昨收
    this.Data;                          //分钟数据
    this.AverageData;                   //分钟均线数据
    this.OverlayChartPaint;
    this.SplitCount = 7;
    this.Symbol;

    this.Operator = function () {
        this.Frame.HorizontalInfo = [];
        if (!this.Data) return;

        var max = this.YClose;
        var min = this.YClose;

        for (var i in this.Data.Data) {
            if (!this.Data.Data[i]) continue;   //价格必须大于0
            if (max < this.Data.Data[i]) max = this.Data.Data[i];
            if (min > this.Data.Data[i]) min = this.Data.Data[i];
        }

        if (this.AverageData) {
            for (var i in this.AverageData.Data) {
                if (!this.AverageData.Data[i]) continue;    //价格必须大于0
                if (max < this.AverageData.Data[i]) max = this.AverageData.Data[i];
                if (min > this.AverageData.Data[i]) min = this.AverageData.Data[i];
            }
        }

        if (this.OverlayChartPaint && this.OverlayChartPaint.length > 0 && this.OverlayChartPaint[0] && this.OverlayChartPaint[0].Symbol) {
            var range = this.OverlayChartPaint[0].GetMaxMin();
            if (range.Max && range.Max > max) max = range.Max;
            if (range.Min && range.Min < min) min = range.Min;
        }

        if (this.YClose == max && this.YClose == min) {
            max = this.YClose + this.YClose * 0.1;
            min = this.YClose - this.YClose * 0.1;
        }
        else {
            var distanceValue = Math.max(Math.abs(this.YClose - max), Math.abs(this.YClose - min));
            max = this.YClose + distanceValue;
            min = this.YClose - distanceValue;
        }

        var showCount = this.SplitCount;
        var distance = (max - min) / (showCount - 1);
        const minDistance = [1, 0.1, 0.01, 0.001, 0.0001];
        var defaultfloatPrecision = JSCommonCoordinateData.GetfloatPrecision(this.Symbol);;    //默认小数位数
        if (JSCommonCoordinateData.MARKET_SUFFIX_NAME.IsSHSZIndex(this.Symbol)) defaultfloatPrecision = 0;    //手机端指数不显示小数位数,太长了

        if (distance < minDistance[defaultfloatPrecision]) {
            distance = minDistance[defaultfloatPrecision];
            max = this.YClose + (distance * (showCount - 1) / 2);
            min = this.YClose - (distance * (showCount - 1) / 2);
        }

        for (var i = 0; i < showCount; ++i) {
            var price = min + (distance * i);
            this.Frame.HorizontalInfo[i] = new CoordinateInfo();
            this.Frame.HorizontalInfo[i].Value = price;

            this.Frame.HorizontalInfo[i].Message[0] = price.toFixed(defaultfloatPrecision);

            if (this.YClose) {
                var per = (price / this.YClose - 1) * 100;
                if (per > 0) this.Frame.HorizontalInfo[i].TextColor = g_JSChartResource.UpTextColor;
                else if (per < 0) this.Frame.HorizontalInfo[i].TextColor = g_JSChartResource.DownTextColor;
                this.Frame.HorizontalInfo[i].Message[1] = IFrameSplitOperator.FormatValueString(per, 2) + '%'; //百分比
            }
        }

        this.Frame.HorizontalMax = max;
        this.Frame.HorizontalMin = min;
    }

}

function FrameSplitMinuteX() 
{
    this.newMethod = IFrameSplitOperator;   //派生
    this.newMethod();
    delete this.newMethod;

    this.ShowText = true;                 //是否显示坐标信息
    this.Symbol = null;                   //股票代码 x轴刻度根据股票类型来调整
    this.DayCount = 1;
    this.DayData;

    this.Operator = function () 
    {
        this.Frame.VerticalInfo = [];
        var xPointCount = this.Frame.XPointCount;
        var width = this.Frame.ChartBorder.GetWidth();
        var isHScreen = (this.Frame.IsHScreen === true);
        if (isHScreen) width = this.Frame.ChartBorder.GetHeight();

        const minuteCoordinate = JSCommonCoordinateData.MinuteCoordinateData;
        var xcoordinateData = minuteCoordinate.GetCoordinateData(this.Symbol, width);
        var minuteCount = xcoordinateData.Count;
        var minuteMiddleCount = xcoordinateData.MiddleCount > 0 ? xcoordinateData.MiddleCount : parseInt(minuteCount / 2);;

        var xcoordinate = xcoordinateData.Data;
        this.Frame.XPointCount = 243;

        this.Frame.XPointCount = minuteCount * this.DayCount;
        this.Frame.MinuteCount = minuteCount;
        this.Frame.VerticalInfo = [];

        if (this.DayCount <= 1) 
        {
            for (var i in xcoordinate) 
            {
                var info = new CoordinateInfo();
                //info.TextColor = "rgb(51,51,51)";
                info.Value = xcoordinate[i][0];
                if (this.ShowText)
                    info.Message[0] = xcoordinate[i][3];
                this.Frame.VerticalInfo[i] = info;
            }
        }
        else 
        {
            for (var i = this.DayData.length - 1, j = 0; i >= 0; --i, ++j) 
            {
                var info = new CoordinateInfo();
                info.Value = j * minuteCount + minuteMiddleCount;
                info.LineType = -1;
                if (this.ShowText) info.Message[0] = IFrameSplitOperator.FormatDateString(this.DayData[i].Date, 'MM-DD');
                this.Frame.VerticalInfo.push(info);

                var info = new CoordinateInfo();
                info.Value = (j + 1) * minuteCount;
                this.Frame.VerticalInfo.push(info);
            }
        }
    }
}

function FrameSplitXData() 
{
    this.newMethod = IFrameSplitOperator;   //派生
    this.newMethod();
    delete this.newMethod;

    this.ShowText = true;                 //是否显示坐标信息

    this.Operator = function () 
    {
        if (this.Frame.Data == null || this.Frame.XData == null) return;
        this.Frame.VerticalInfo = [];
        var xOffset = this.Frame.Data.DataOffset;
        var xPointCount = this.Frame.XPointCount;

        for (var i = 0, index = xOffset; i < xPointCount && index < this.Frame.Data.Data.length; ++i, ++index) 
        {
            var info = new CoordinateInfo();
            info.Value = index - xOffset;

            if (this.ShowText)
                info.Message[0] = this.Frame.XData[i];

            this.Frame.VerticalInfo.push(info);
        }
    }
}

//导出统一使用JSCommon命名空间名
module.exports =
{
    JSCommonSplit: 
    {
        CoordinateInfo: CoordinateInfo,
        IFrameSplitOperator: IFrameSplitOperator,
        FrameSplitKLinePriceY: FrameSplitKLinePriceY,
        FrameSplitY: FrameSplitY,
        FrameSplitKLineX: FrameSplitKLineX,
        FrameSplitMinutePriceY: FrameSplitMinutePriceY,
        FrameSplitMinuteX: FrameSplitMinuteX,
        FrameSplitXData: FrameSplitXData,
    },

    JSCommonSplit_CoordinateInfo: CoordinateInfo,
    JSCommonSplit_IFrameSplitOperator: IFrameSplitOperator,
    JSCommonSplit_FrameSplitKLinePriceY: FrameSplitKLinePriceY,
    JSCommonSplit_FrameSplitY: FrameSplitY,
    JSCommonSplit_FrameSplitKLineX: FrameSplitKLineX,
    JSCommonSplit_FrameSplitMinutePriceY: FrameSplitMinutePriceY,
    JSCommonSplit_FrameSplitMinuteX: FrameSplitMinuteX,
    JSCommonSplit_FrameSplitXData: FrameSplitXData,
};